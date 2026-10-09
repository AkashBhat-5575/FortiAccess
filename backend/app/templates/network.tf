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
