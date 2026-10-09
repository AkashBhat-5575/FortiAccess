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
