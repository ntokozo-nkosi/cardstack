variable "aws_region" {
  description = "AWS region for the stack."
  type        = string
  default     = "af-south-1"
}

variable "project" {
  description = "Project name used in resource names and tags."
  type        = string
  default     = "cardstack-api"
}

variable "environment" {
  description = "Terraform environment name."
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be staging or production."
  }
}

variable "vpc_cidr" {
  description = "Optional CIDR block override for the selected environment VPC."
  type        = string
  default     = null

  validation {
    condition     = var.vpc_cidr == null ? true : can(cidrnetmask(var.vpc_cidr))
    error_message = "vpc_cidr must be a valid CIDR block."
  }
}

variable "vpc_cidrs" {
  description = "Default CIDR blocks by environment."
  type        = map(string)
  default = {
    staging    = "10.80.0.0/20"
    production = "10.80.16.0/20"
  }

  validation {
    condition     = alltrue([for cidr in values(var.vpc_cidrs) : can(cidrnetmask(cidr))])
    error_message = "All vpc_cidrs values must be valid CIDR blocks."
  }
}

variable "github_repository" {
  description = "GitHub repository allowed to assume the deploy role, in owner/repo form."
  type        = string

  validation {
    condition     = can(regex("^[^/]+/[^/]+$", var.github_repository))
    error_message = "github_repository must be in owner/repo form."
  }
}

variable "doppler_token_api" {
  description = "Doppler service token exposed to API tasks as DOPPLER_TOKEN."
  type        = string
  sensitive   = true
}

variable "api_instance_type" {
  description = "EC2 instance type for ECS API capacity."
  type        = string
  default     = "t4g.micro"
}

variable "api_task_cpu" {
  description = "ECS CPU units reserved by the API task."
  type        = number
  default     = 256
}

variable "api_task_memory" {
  description = "MiB reserved by the API task."
  type        = number
  default     = 512
}

variable "api_desired_count" {
  description = "Desired API task count."
  type        = number
  default     = 1
}
