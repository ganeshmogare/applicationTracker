variable "environment" {
  description = "Environment name"
  type        = string
}

variable "app_image" {
  description = "Docker image for the application"
  type        = string
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

variable "app_cpu" {
  description = "CPU units for the application"
  type        = number
  default     = 256
}

variable "app_memory" {
  description = "Memory for the application"
  type        = number
  default     = 512
}

variable "private_subnets" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "ecs_security_group_id" {
  description = "ECS security group ID"
  type        = string
}

variable "target_group_arn" {
  description = "Target group ARN for the load balancer"
  type        = string
}

variable "cors_origin" {
  description = "CORS origin"
  type        = string
  default     = "*"
}

variable "temporal_address" {
  description = "Temporal server address"
  type        = string
  default     = "localhost:7233"
}

variable "db_host" {
  description = "Database host"
  type        = string
}

variable "db_port" {
  description = "Database port"
  type        = number
  default     = 5432
}

variable "db_user" {
  description = "Database user"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "email_smtp_host" {
  description = "SMTP host"
  type        = string
  default     = ""
}

variable "email_smtp_user" {
  description = "SMTP user"
  type        = string
  default     = ""
}

variable "email_smtp_pass" {
  description = "SMTP password"
  type        = string
  default     = ""
}

variable "gemini_api_key" {
  description = "Gemini API key"
  type        = string
  default     = ""
}
