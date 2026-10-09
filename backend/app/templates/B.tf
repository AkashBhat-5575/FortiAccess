locals {
  compute_principal = "ecs-tasks.amazonaws.com"
  target_type       = "ip"
}
variable "container_image" {
  type        = string
  description = "Your application image listening on port 8080 with /health; enforce DB TLS."
}
resource "aws_ecs_cluster" "app" { name = var.name }
resource "aws_iam_role" "execution" {
  name               = "${var.name}-execution"
  assume_role_policy = aws_iam_role.app.assume_role_policy
}
resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
resource "aws_iam_role_policy" "secret" {
  role = aws_iam_role.execution.id
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = ["ssm:GetParameters"], Resource = aws_ssm_parameter.database.arn }]
  })
}
resource "aws_ssm_parameter" "database" {
  name  = "/${var.name}/database-password"
  type  = "SecureString"
  value = var.database_password
}
resource "aws_ecs_task_definition" "app" {
  family                   = var.name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.app.arn
  container_definitions = jsonencode([{
    name             = "app", image = var.container_image, essential = true,
    portMappings     = [{ containerPort = 8080 }],
    environment      = [{ name = "DB_HOST", value = aws_db_instance.data.address }, { name = "DB_NAME", value = "fortiaccess" }, { name = "DB_USER", value = "fortiaccess" }],
    secrets          = [{ name = "DB_PASSWORD", valueFrom = aws_ssm_parameter.database.arn }],
    logConfiguration = { logDriver = "awslogs", options = { "awslogs-group" = aws_cloudwatch_log_group.app.name, "awslogs-region" = var.region, "awslogs-stream-prefix" = "ecs" } }
  }])
}
resource "aws_ecs_service" "app" {
  name            = var.name
  cluster         = aws_ecs_cluster.app.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.replicas
  launch_type     = "FARGATE"
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.compute.id]
    assign_public_ip = false
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"
    container_port   = 8080
  }
  depends_on = [aws_lb_listener_rule.origin, aws_iam_role_policy.secret, aws_iam_role_policy_attachment.execution]
}
resource "aws_appautoscaling_target" "app" {
  max_capacity       = max(4, var.replicas * 2)
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.app.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}
resource "aws_appautoscaling_policy" "cpu" {
  name               = "${var.name}-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.app.resource_id
  scalable_dimension = aws_appautoscaling_target.app.scalable_dimension
  service_namespace  = aws_appautoscaling_target.app.service_namespace
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification { predefined_metric_type = "ECSServiceAverageCPUUtilization" }
    target_value = 60
  }
}
