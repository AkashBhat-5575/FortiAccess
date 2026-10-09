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
