terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "job-tracker-terraform-state-145006476500"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "job-application-tracker"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"
  
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
}

# ECS Cluster and Services
module "ecs" {
  source = "./modules/ecs"
  
  environment           = var.environment
  private_subnets       = module.vpc.private_subnets
  ecs_security_group_id = module.vpc.ecs_security_group_id
  target_group_arn      = module.alb.target_group_arn
  
  app_image = var.app_image
  app_port  = var.app_port
  app_count = var.app_count
  
  db_host     = split(":", module.rds.endpoint)[0]
  db_name     = var.db_name
  db_user     = var.db_username
  db_password = var.db_password
  
  depends_on = [module.vpc, module.alb, module.rds]
}

# RDS Database
module "rds" {
  source = "./modules/rds"
  
  environment           = var.environment
  private_subnets       = module.vpc.private_subnets
  rds_security_group_id = module.vpc.rds_security_group_id
  
  db_name     = var.db_name
  db_username = var.db_username
  db_password = var.db_password
  
  depends_on = [module.vpc]
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"
  
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnets        = module.vpc.public_subnets
  alb_security_group_id = module.vpc.alb_security_group_id
  app_port              = var.app_port
  
  depends_on = [module.vpc]
}

# CloudWatch Logs
module "cloudwatch" {
  source = "./modules/cloudwatch"
  
  environment = var.environment
  app_name    = var.app_name
}

# Temporal Server
module "temporal" {
  source = "./modules/temporal"

  environment           = var.environment
  cluster_id            = module.ecs.cluster_arn
  vpc_id                = module.vpc.vpc_id
  private_subnets       = module.vpc.private_subnets
  execution_role_arn    = "arn:aws:iam::145006476500:role/ecsTaskExecutionRole"
  ecs_security_group_id = module.vpc.ecs_security_group_id

  db_host     = split(":", module.rds.endpoint)[0]
  db_user     = var.db_username
  db_password = var.db_password

  depends_on = [module.vpc, module.rds, module.ecs]
}

# Temporal Worker
module "worker" {
  source = "./modules/worker"

  environment        = var.environment
  cluster_id         = module.ecs.cluster_arn
  vpc_id             = module.vpc.vpc_id
  private_subnets    = module.vpc.private_subnets
  execution_role_arn = "arn:aws:iam::145006476500:role/ecsTaskExecutionRole"
  task_role_arn      = "arn:aws:iam::145006476500:role/ecsTaskExecutionRole"
  worker_image       = "145006476500.dkr.ecr.us-east-1.amazonaws.com/job-application-tracker:worker"

  temporal_address = "${module.temporal.temporal_service_name}.${var.environment}-temporal-service:7233"
  
  db_host     = split(":", module.rds.endpoint)[0]
  db_name     = var.db_name
  db_user     = var.db_username
  db_password = var.db_password

  email_smtp_host = "smtp.sendgrid.net"
  email_smtp_port = "587"
  email_smtp_user = "apikey"
  email_smtp_pass = "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"
  email_from      = "ganumogare18@gmail.com"
  email_to        = "mogriganpati18@gmail.com"
  
  gemini_api_key = "AIzaSyAlgwAPLcDrHn8QgovZhXNT2Eyv4WjJ4-o"
  gemini_model   = "gemini-1.5-flash"

  depends_on = [module.vpc, module.rds, module.temporal]
}
