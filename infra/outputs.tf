output "api_gateway_invoke_url" {
  description = "Public HTTPS base URL for the API Gateway HTTP API."
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "load_balancer_dns_name" {
  description = "Internal load balancer DNS name used by API Gateway VPC Link."
  value       = aws_lb.api.dns_name
}

output "vpc_id" {
  description = "VPC ID."
  value       = aws_vpc.this.id
}

output "subnet_ids_by_tier" {
  description = "Subnet IDs grouped by tier."
  value = {
    for tier in keys(local.tiers) :
    tier => [for suffix in local.az_suffixes : aws_subnet.this["${tier}-${suffix}"].id]
  }
}

output "ecr_repository_url" {
  description = "ECR repository URL for the API image."
  value       = aws_ecr_repository.api.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.this.name
}

output "ecs_service_name" {
  description = "ECS API service name."
  value       = aws_ecs_service.api.name
}

output "github_actions_role_arn" {
  description = "IAM role ARN to store as the matching GitHub deploy role variable."
  value       = aws_iam_role.github_actions.arn
}
