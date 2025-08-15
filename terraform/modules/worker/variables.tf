variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cluster_id" {
  description = "ECS cluster ID"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnets" {
  description = "Private subnets for worker"
  type        = list(string)
}

variable "execution_role_arn" {
  description = "ECS execution role ARN"
  type        = string
}

variable "task_role_arn" {
  description = "ECS task role ARN"
  type        = string
}

variable "worker_image" {
  description = "Worker Docker image"
  type        = string
}

variable "temporal_address" {
  description = "Temporal server address"
  type        = string
}

variable "db_host" {
  description = "Database host"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_user" {
  description = "Database user"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
}

variable "email_smtp_host" {
  description = "Email SMTP host"
  type        = string
}

variable "email_smtp_port" {
  description = "Email SMTP port"
  type        = string
}

variable "email_smtp_user" {
  description = "Email SMTP user"
  type        = string
}

variable "email_smtp_pass" {
  description = "Email SMTP password"
  type        = string
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
}

variable "gemini_model" {
  description = "Gemini model"
  type        = string
}
