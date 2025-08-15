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

variable "email_smtp_host" {
  description = "Email SMTP host"
  type        = string
  default     = "smtp.sendgrid.net"
}

variable "email_smtp_port" {
  description = "Email SMTP port"
  type        = string
  default     = "587"
}

variable "email_smtp_user" {
  description = "Email SMTP user"
  type        = string
  default     = "apikey"
}

variable "email_smtp_pass" {
  description = "Email SMTP password"
  type        = string
  sensitive   = true
}

variable "email_from" {
  description = "Email from address"
  type        = string
}

variable "email_to" {
  description = "Email to address"
  type        = string
}

variable "gemini_api_key" {
  description = "Gemini API key"
  type        = string
  sensitive   = true
}

variable "gemini_model" {
  description = "Gemini model"
  type        = string
  default     = "gemini-1.5-flash"
}
