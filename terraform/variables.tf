variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "job-application-tracker"
}

variable "app_image" {
  description = "Docker image for the application"
  type        = string
  default     = "job-tracker:latest"
}

variable "app_port" {
  description = "Port exposed by the application"
  type        = number
  default     = 3000
}

variable "app_count" {
  description = "Number of application instances"
  type        = number
  default     = 1
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "temporal"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "temporal"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}
