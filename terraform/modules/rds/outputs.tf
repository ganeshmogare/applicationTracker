output "endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "username" {
  description = "RDS master username"
  value       = aws_db_instance.main.username
}

output "arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}
