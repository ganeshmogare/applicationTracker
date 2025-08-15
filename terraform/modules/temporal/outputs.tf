output "temporal_security_group_id" {
  description = "Temporal security group ID"
  value       = aws_security_group.temporal.id
}

output "temporal_service_name" {
  description = "Temporal service name"
  value       = aws_ecs_service.temporal.name
}

output "temporal_task_definition_arn" {
  description = "Temporal task definition ARN"
  value       = aws_ecs_task_definition.temporal.arn
}
