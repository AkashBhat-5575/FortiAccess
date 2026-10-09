# FortiAccess GENERATED MVP — not deployed infrastructure.
# Planning topology only. Review security, quotas, prices and artifacts before apply.
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}
variable "region" {
  type    = string
  default = "us-east-1"
}
variable "name" {
  type    = string
  default = "fortiaccess"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,19}$", var.name))
    error_message = "Use 3–20 lowercase letters, digits or hyphens, beginning with a letter."
  }
}
variable "origin_secret" {
  type        = string
  sensitive   = true
  description = "Random 32+ character secret for CloudFront origin validation. It remains in Terraform state."
  validation {
    condition     = length(var.origin_secret) >= 32
    error_message = "Use a secret of at least 32 characters."
  }
}
provider "aws" {
  region = var.region
}
resource "aws_cloudwatch_log_group" "app" {
  name              = "/fortiaccess/${var.name}"
  retention_in_days = 30
}
resource "aws_iam_role" "app" {
  name = "${var.name}-app"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = local.compute_principal }, Action = "sts:AssumeRole" }]
  })
}
resource "aws_iam_role_policy" "logs" {
  role = aws_iam_role.app.id
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = ["logs:CreateLogStream", "logs:PutLogEvents"], Resource = "${aws_cloudwatch_log_group.app.arn}:*" }]
  })
}
resource "aws_cloudfront_distribution" "app" {
  enabled         = true
  is_ipv6_enabled = true
  origin {
    domain_name = local.origin_domain
    origin_id   = "application"
    custom_header {
      name  = "X-FortiAccess-Origin"
      value = var.origin_secret
    }
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = local.origin_protocol
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  default_cache_behavior {
    target_origin_id       = "application"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    # Disabled caching and all viewer headers except Host for dynamic API traffic.
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"
  }
  restrictions {
    geo_restriction { restriction_type = "none" }
  }
  viewer_certificate { cloudfront_default_certificate = true }
}
output "cloudfront_url" { value = "https://${aws_cloudfront_distribution.app.domain_name}" }
# Package backend/examples/lambda_function.py into lambda.zip before planning.
# Origin validation is NOT end-user authentication. Implement application authorization.
locals {
  compute_principal = "lambda.amazonaws.com"
  origin_domain     = replace(aws_apigatewayv2_api.app.api_endpoint, "https://", "")
  origin_protocol   = "https-only"
}
variable "lambda_zip" {
  type    = string
  default = "lambda.zip"
}
resource "aws_dynamodb_table" "data" {
  name         = "${var.name}-data"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }
}
resource "aws_iam_role_policy" "data" {
  role = aws_iam_role.app.id
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = ["dynamodb:GetItem", "dynamodb:PutItem"], Resource = aws_dynamodb_table.data.arn }]
  })
}
resource "aws_lambda_function" "app" {
  function_name    = var.name
  role             = aws_iam_role.app.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.12"
  filename         = var.lambda_zip
  source_code_hash = filebase64sha256(var.lambda_zip)
  memory_size      = 512
  timeout          = 15
  logging_config {
    log_format = "Text"
    log_group  = aws_cloudwatch_log_group.app.name
  }
  environment {
    variables = { TABLE_NAME = aws_dynamodb_table.data.name, ORIGIN_SECRET = var.origin_secret }
  }
  depends_on = [aws_iam_role_policy.logs, aws_iam_role_policy.data]
}
resource "aws_apigatewayv2_api" "app" {
  name          = var.name
  protocol_type = "HTTP"
}
resource "aws_apigatewayv2_integration" "app" {
  api_id                 = aws_apigatewayv2_api.app.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.app.invoke_arn
  payload_format_version = "2.0"
}
resource "aws_apigatewayv2_route" "app" {
  api_id    = aws_apigatewayv2_api.app.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.app.id}"
}
resource "aws_apigatewayv2_stage" "app" {
  api_id      = aws_apigatewayv2_api.app.id
  name        = "$default"
  auto_deploy = true
  default_route_settings {
    throttling_burst_limit = 100
    throttling_rate_limit  = 50
  }
}
resource "aws_lambda_permission" "api" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.app.execution_arn}/*/*"
}
