output "worker_security_group_id" {
  description = "Worker security group ID"
  value       = aws_security_group.worker.id
}

output "worker_service_name" {
  description = "Worker service name"
  value       = aws_ecs_service.worker.name
}

output "worker_task_definition_arn" {
  description = "Worker task definition ARN"
  value       = aws_ecs_task_definition.worker.arn
}
