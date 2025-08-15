# Temporal Server ECS Service
resource "aws_ecs_task_definition" "temporal" {
  family                   = "${var.environment}-temporal"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = var.execution_role_arn

  container_definitions = jsonencode([
    {
      name  = "temporal"
      image = "temporalio/auto-setup:1.22.3"
      
      environment = [
        {
          name  = "DB"
          value = "postgres12"
        },
        {
          name  = "DB_PORT"
          value = "5432"
        },
        {
          name  = "POSTGRES_USER"
          value = var.db_user
        },
        {
          name  = "POSTGRES_PWD"
          value = var.db_password
        },
        {
          name  = "POSTGRES_SEEDS"
          value = var.db_host
        },
        {
          name  = "DYNAMIC_CONFIG_FILE_PATH"
          value = "config/dynamicconfig/development-sql.yaml"
        },
        {
          name  = "TEMPORAL_ADDRESS"
          value = "0.0.0.0:7233"
        }
      ]

      portMappings = [
        {
          containerPort = 7233
          protocol      = "tcp"
        }
      ]

      essential = true

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/${var.environment}-temporal"
          awslogs-region        = "us-east-1"
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])

  depends_on = [var.db_host]
}

resource "aws_ecs_service" "temporal" {
  name            = "${var.environment}-temporal-service"
  cluster         = var.cluster_id
  task_definition = aws_ecs_task_definition.temporal.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnets
    security_groups  = [aws_security_group.temporal.id]
    assign_public_ip = false
  }

  depends_on = [aws_ecs_task_definition.temporal]
}

# CloudWatch Log Group for Temporal
resource "aws_cloudwatch_log_group" "temporal" {
  name              = "/ecs/${var.environment}-temporal"
  retention_in_days = 7
}

# Security Group for Temporal
resource "aws_security_group" "temporal" {
  name_prefix = "${var.environment}-temporal-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 7233
    to_port         = 7233
    protocol        = "tcp"
    security_groups = [var.ecs_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-temporal-sg"
  }
}
