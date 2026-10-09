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
# Use an EXISTING VPC with two AZs and private subnet outbound access (NAT/endpoints).
# Network is a prerequisite, not provisioned by this MVP.
variable "vpc_id" { type = string }
variable "public_subnet_ids" {
  type = list(string)
  validation {
    condition     = length(var.public_subnet_ids) >= 2
    error_message = "Supply public subnets in at least two AZs."
  }
}
variable "private_subnet_ids" {
  type = list(string)
  validation {
    condition     = length(var.private_subnet_ids) >= 2
    error_message = "Supply private subnets in at least two AZs with outbound connectivity."
  }
}
variable "certificate_arn" {
  type        = string
  description = "Regional ACM certificate covering origin_domain."
}
variable "origin_domain" {
  type        = string
  description = "DNS name covered by certificate, created below in your hosted zone."
}
variable "hosted_zone_id" { type = string }
variable "database_password" {
  type      = string
  sensitive = true
  validation {
    condition     = length(var.database_password) >= 16
    error_message = "Use a database password of at least 16 characters."
  }
}
variable "replicas" {
  type    = number
  default = 2
  validation {
    condition     = var.replicas >= 2 && floor(var.replicas) == var.replicas
    error_message = "Use at least two replicas."
  }
}
locals {
  origin_domain   = var.origin_domain
  origin_protocol = "https-only"
}
resource "aws_security_group" "alb" {
  name   = "${var.name}-alb"
  vpc_id = var.vpc_id
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
resource "aws_security_group" "compute" {
  name   = "${var.name}-compute"
  vpc_id = var.vpc_id
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
resource "aws_security_group" "database" {
  name   = "${var.name}-database"
  vpc_id = var.vpc_id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.compute.id]
  }
}
resource "aws_lb" "app" {
  name               = var.name
  load_balancer_type = "application"
  subnets            = var.public_subnet_ids
  security_groups    = [aws_security_group.alb.id]
}
resource "aws_route53_record" "origin" {
  zone_id = var.hosted_zone_id
  name    = var.origin_domain
  type    = "A"
  alias {
    name                   = aws_lb.app.dns_name
    zone_id                = aws_lb.app.zone_id
    evaluate_target_health = true
  }
}
resource "aws_lb_target_group" "app" {
  name        = var.name
  port        = 8080
  protocol    = "HTTP"
  target_type = local.target_type
  vpc_id      = var.vpc_id
  health_check { path = "/health" }
}
resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.app.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn
  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Origin access denied"
      status_code  = "403"
    }
  }
}
resource "aws_lb_listener_rule" "origin" {
  listener_arn = aws_lb_listener.app.arn
  priority     = 1
  condition {
    http_header {
      http_header_name = "X-FortiAccess-Origin"
      values           = [var.origin_secret]
    }
  }
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
resource "aws_db_subnet_group" "app" { subnet_ids = var.private_subnet_ids }
resource "aws_db_instance" "data" {
  identifier                = "${var.name}-data"
  engine                    = "postgres"
  instance_class            = "db.t3.micro"
  allocated_storage         = 20
  storage_encrypted         = true
  multi_az                  = true
  db_name                   = "fortiaccess"
  username                  = "fortiaccess"
  password                  = var.database_password
  publicly_accessible       = false
  db_subnet_group_name      = aws_db_subnet_group.app.name
  vpc_security_group_ids    = [aws_security_group.database.id]
  backup_retention_period   = 7
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.name}-final"
}
output "database_endpoint" { value = aws_db_instance.data.address }
locals {
  compute_principal = "ec2.amazonaws.com"
  target_type       = "instance"
}
variable "application_user_data" {
  type        = string
  sensitive   = true
  description = "Bootstrap your real application on port 8080 with /health. Configure DB TLS and CloudWatch agent to the supplied log group. No demo server is silently deployed."
}
data "aws_ssm_parameter" "ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}
resource "aws_iam_instance_profile" "app" { role = aws_iam_role.app.name }
resource "aws_launch_template" "app" {
  name_prefix            = "${var.name}-"
  image_id               = data.aws_ssm_parameter.ami.value
  instance_type          = "t3.small"
  user_data              = base64encode(var.application_user_data)
  vpc_security_group_ids = [aws_security_group.compute.id]
  iam_instance_profile { name = aws_iam_instance_profile.app.name }
  metadata_options {
    http_tokens = "required"
  }
  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = 20
      encrypted   = true
    }
  }
}
resource "aws_autoscaling_group" "app" {
  name                      = var.name
  min_size                  = 2
  desired_capacity          = var.replicas
  max_size                  = max(4, var.replicas * 2)
  vpc_zone_identifier       = var.private_subnet_ids
  target_group_arns         = [aws_lb_target_group.app.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300
  launch_template {
    id      = aws_launch_template.app.id
    version = aws_launch_template.app.latest_version
  }
  depends_on = [aws_db_instance.data, aws_lb_listener_rule.origin]
}
resource "aws_autoscaling_policy" "cpu" {
  name                   = "${var.name}-cpu"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"
  target_tracking_configuration {
    predefined_metric_specification { predefined_metric_type = "ASGAverageCPUUtilization" }
    target_value = 60
  }
}
