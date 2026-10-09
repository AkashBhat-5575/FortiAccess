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
