terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "job-tracker-terraform-state"
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
  
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  public_subnets  = module.vpc.public_subnets
  
  app_image       = var.app_image
  app_port        = var.app_port
  app_count       = var.app_count
  
  depends_on = [module.vpc]
}

# RDS Database
module "rds" {
  source = "./modules/rds"
  
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  
  db_name     = var.db_name
  db_username = var.db_username
  db_password = var.db_password
  
  depends_on = [module.vpc]
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"
  
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  public_subnets  = module.vpc.public_subnets
  app_port        = var.app_port
  
  depends_on = [module.ecs]
}

# CloudWatch Logs
module "cloudwatch" {
  source = "./modules/cloudwatch"
  
  environment = var.environment
  app_name    = var.app_name
}
