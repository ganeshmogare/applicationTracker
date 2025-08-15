resource "aws_ecs_cluster" "main" {
  name = "${var.environment}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.environment}-ecs-cluster"
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.environment}-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.app_cpu
  memory                   = var.app_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "${var.environment}-app"
      image = var.app_image

      portMappings = [
        {
          containerPort = var.app_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "API_PORT"
          value = tostring(var.app_port)
        },
        {
          name  = "CORS_ORIGIN"
          value = var.cors_origin
        },
        {
          name  = "TEMPORAL_ADDRESS"
          value = var.temporal_address
        },
        {
          name  = "DB_HOST"
          value = var.db_host
        },
        {
          name  = "DB_PORT"
          value = tostring(var.db_port)
        },
        {
          name  = "DB_USER"
          value = var.db_user
        },
        {
          name  = "DB_PASSWORD"
          value = var.db_password
        },
        {
          name  = "DB_NAME"
          value = var.db_name
        }
      ]

      secrets = [
        {
          name      = "EMAIL_SMTP_HOST"
          valueFrom = aws_ssm_parameter.email_smtp_host.arn
        },
        {
          name      = "EMAIL_SMTP_USER"
          valueFrom = aws_ssm_parameter.email_smtp_user.arn
        },
        {
          name      = "EMAIL_SMTP_PASS"
          valueFrom = aws_ssm_parameter.email_smtp_pass.arn
        },
        {
          name      = "GEMINI_API_KEY"
          valueFrom = aws_ssm_parameter.gemini_api_key.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.app.name
          awslogs-region        = data.aws_region.current.name
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${var.app_port}/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${var.environment}-app-task-definition"
  }
}

resource "aws_ecs_service" "app" {
  name            = "${var.environment}-app-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.app_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [var.ecs_security_group_id]
    subnets          = var.private_subnets
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = "${var.environment}-app"
    container_port   = var.app_port
  }

  depends_on = [aws_ecs_task_definition.app]

  tags = {
    Name = "${var.environment}-app-service"
  }
}

# IAM Roles
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.environment}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task_role" {
  name = "${var.environment}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "ecs_task_role_policy" {
  name = "${var.environment}-ecs-task-role-policy"
  role = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_ssm_parameter.email_smtp_host.arn,
          aws_ssm_parameter.email_smtp_user.arn,
          aws_ssm_parameter.email_smtp_pass.arn,
          aws_ssm_parameter.gemini_api_key.arn
        ]
      }
    ]
  })
}

# SSM Parameters for secrets
resource "aws_ssm_parameter" "email_smtp_host" {
  name  = "/${var.environment}/email/smtp/host"
  type  = "SecureString"
  value = var.email_smtp_host
}

resource "aws_ssm_parameter" "email_smtp_user" {
  name  = "/${var.environment}/email/smtp/user"
  type  = "SecureString"
  value = var.email_smtp_user
}

resource "aws_ssm_parameter" "email_smtp_pass" {
  name  = "/${var.environment}/email/smtp/pass"
  type  = "SecureString"
  value = var.email_smtp_pass
}

resource "aws_ssm_parameter" "gemini_api_key" {
  name  = "/${var.environment}/gemini/api/key"
  type  = "SecureString"
  value = var.gemini_api_key
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.environment}-app"
  retention_in_days = 30
}

# Data sources
data "aws_region" "current" {}
