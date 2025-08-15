# Temporal Worker ECS Service
resource "aws_ecs_task_definition" "worker" {
  family                   = "${var.environment}-worker"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = var.execution_role_arn
  task_role_arn           = var.task_role_arn

  container_definitions = jsonencode([
    {
      name  = "worker"
      image = var.worker_image
      
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
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
          name  = "DB_NAME"
          value = var.db_name
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
          name  = "EMAIL_SMTP_HOST"
          value = var.email_smtp_host
        },
        {
          name  = "EMAIL_SMTP_PORT"
          value = var.email_smtp_port
        },
        {
          name  = "EMAIL_SMTP_USER"
          value = var.email_smtp_user
        },
        {
          name  = "EMAIL_SMTP_PASS"
          value = var.email_smtp_pass
        },
        {
          name  = "EMAIL_FROM"
          value = var.email_from
        },
        {
          name  = "EMAIL_TO"
          value = var.email_to
        },
        {
          name  = "GEMINI_API_KEY"
          value = var.gemini_api_key
        },
        {
          name  = "GEMINI_MODEL"
          value = var.gemini_model
        }
      ]

      essential = true

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/${var.environment}-worker"
          awslogs-region        = "us-east-1"
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "worker" {
  name            = "${var.environment}-worker-service"
  cluster         = var.cluster_id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnets
    security_groups  = [aws_security_group.worker.id]
    assign_public_ip = false
  }

  depends_on = [aws_ecs_task_definition.worker]
}

# CloudWatch Log Group for Worker
resource "aws_cloudwatch_log_group" "worker" {
  name              = "/ecs/${var.environment}-worker"
  retention_in_days = 7
}

# Security Group for Worker
resource "aws_security_group" "worker" {
  name_prefix = "${var.environment}-worker-"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-worker-sg"
  }
}
