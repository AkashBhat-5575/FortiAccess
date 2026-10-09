def generate_terraform(architecture_id: str) -> str:

    if architecture_id == "A":
        return """
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_instance" "app_server" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"

  tags = {
    Name = "FortiAccess-App-Server"
  }
}

resource "aws_db_instance" "database" {
  allocated_storage   = 20
  engine              = "mysql"
  instance_class      = "db.t3.micro"
  username            = "admin"
  password            = "change-this-password"
  skip_final_snapshot = true

  tags = {
    Name = "FortiAccess-Database"
  }
}
"""

    elif architecture_id == "B":
        return """
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_ecs_cluster" "fortiaccess" {
  name = "fortiaccess-cluster"
}

resource "aws_lb" "application" {
  name               = "fortiaccess-alb"
  load_balancer_type = "application"

  # Add subnets and security groups
  # according to your AWS environment.
}

output "cluster_name" {
  value = aws_ecs_cluster.fortiaccess.name
}
"""

    elif architecture_id == "C":
        return """
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_dynamodb_table" "fortiaccess" {
  name         = "fortiaccess-data"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name = "FortiAccess-Data"
  }
}

resource "aws_lambda_function" "fortiaccess" {
  function_name = "fortiaccess-function"
  role          = var.lambda_role_arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.12"

  filename = "lambda.zip"
}

variable "lambda_role_arn" {
  type = string
}
"""

    else:
        return "# Invalid architecture ID"