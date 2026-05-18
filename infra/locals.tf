locals {
  az_suffixes = ["a"]
  vpc_cidr    = coalesce(var.vpc_cidr, var.vpc_cidrs[var.environment])

  tiers = {
    public   = { offset = 0 }
    private  = { offset = 1 }
    isolated = { offset = 2 }
    reserved = { offset = 3 }
  }

  subnets = merge([
    for tier_name, tier in local.tiers : {
      for index, suffix in local.az_suffixes :
      "${tier_name}-${suffix}" => {
        cidr      = cidrsubnet(local.vpc_cidr, 4, tier.offset + index)
        az        = "${var.aws_region}${suffix}"
        az_suffix = suffix
        tier      = tier_name
      }
    }
  ]...)

  name_prefix       = "${var.project}-${var.environment}"
  container_name    = "api"
  container_port    = 8080
  health_check_path = "/health"
  ecr_repository    = local.name_prefix
  log_group_name    = "/ecs/${var.project}/${var.environment}"
}
