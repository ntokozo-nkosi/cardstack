data "aws_ssm_parameter" "ecs_optimized_ami" {
  name = "/aws/service/ecs/optimized-ami/amazon-linux-2023/arm64/recommended/image_id"
}

resource "aws_security_group" "api_instance" {
  name_prefix = "ecs-api-${local.name_prefix}-"
  description = "Security group for ECS API instances"
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "Allow internal NLB/API Gateway traffic to reach ECS dynamic host ports"
    from_port   = 32768
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [local.vpc_cidr]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "sg-ecs-api-${local.name_prefix}"
  }
}

resource "aws_ecs_cluster" "this" {
  name = "ecs-${local.name_prefix}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "ecs-${local.name_prefix}"
  }
}

resource "aws_cloudwatch_log_group" "api" {
  name              = local.log_group_name
  retention_in_days = 30

  tags = {
    Name = "logs-${local.name_prefix}"
  }
}

resource "aws_launch_template" "api" {
  name_prefix   = "ecs-api-${local.name_prefix}-"
  image_id      = data.aws_ssm_parameter.ecs_optimized_ami.value
  instance_type = var.api_instance_type

  vpc_security_group_ids = [aws_security_group.api_instance.id]
  update_default_version = true

  iam_instance_profile {
    name = aws_iam_instance_profile.ecs_instance.name
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  user_data = base64encode(<<-EOT
    #!/bin/bash
    cat <<'EOF' >> /etc/ecs/ecs.config
    ECS_CLUSTER=${aws_ecs_cluster.this.name}
    ECS_INSTANCE_ATTRIBUTES={"role": "api"}
    EOF
  EOT
  )

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name = "ecs-api-${local.name_prefix}"
    }
  }

  tag_specifications {
    resource_type = "volume"

    tags = {
      Name = "ecs-api-${local.name_prefix}"
    }
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [image_id]
  }

  tags = {
    Name = "lt-ecs-api-${local.name_prefix}"
  }
}

resource "aws_autoscaling_group" "api" {
  name_prefix = "asg-ecs-api-${local.name_prefix}-"

  min_size         = 1
  desired_capacity = 1
  max_size         = 2

  health_check_type         = "EC2"
  health_check_grace_period = 90
  capacity_rebalance        = true
  vpc_zone_identifier       = [for suffix in local.az_suffixes : aws_subnet.this["private-${suffix}"].id]

  launch_template {
    id      = aws_launch_template.api.id
    version = aws_launch_template.api.latest_version
  }

  instance_refresh {
    strategy = "Rolling"

    preferences {
      instance_warmup        = 90
      min_healthy_percentage = 100
      max_healthy_percentage = 200
      skip_matching          = true
    }
  }

  lifecycle {
    create_before_destroy = true
  }

  tag {
    key                 = "Name"
    value               = "ecs-api-${local.name_prefix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "AmazonECSManaged"
    value               = "true"
    propagate_at_launch = true
  }
}

resource "aws_ecs_capacity_provider" "api" {
  name = "api-${local.name_prefix}"

  auto_scaling_group_provider {
    auto_scaling_group_arn         = aws_autoscaling_group.api.arn
    managed_draining               = "ENABLED"
    managed_termination_protection = "DISABLED"

    managed_scaling {
      status          = "ENABLED"
      target_capacity = 100
    }
  }

  tags = {
    Name = "cp-api-${local.name_prefix}"
  }
}

resource "aws_ecs_cluster_capacity_providers" "this" {
  cluster_name       = aws_ecs_cluster.this.name
  capacity_providers = [aws_ecs_capacity_provider.api.name]

  default_capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.api.name
    weight            = 1
  }
}

resource "aws_ecs_task_definition" "api" {
  family                   = local.name_prefix
  requires_compatibilities = ["EC2"]
  network_mode             = "bridge"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name      = local.container_name
      image     = "${aws_ecr_repository.api.repository_url}:latest"
      cpu       = var.api_task_cpu
      memory    = var.api_task_memory
      essential = true

      portMappings = [
        {
          containerPort = local.container_port
          hostPort      = 0
          protocol      = "tcp"
        }
      ]

      secrets = [
        {
          name      = "DOPPLER_TOKEN"
          valueFrom = aws_ssm_parameter.doppler_token.arn
        }
      ]

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${local.container_port}${local.health_check_path} || exit 1"]
        interval    = 15
        timeout     = 5
        retries     = 3
        startPeriod = 20
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = local.container_name
        }
      }
    }
  ])

  tags = {
    Name = "task-${local.name_prefix}"
  }
}

resource "aws_ecs_service" "api" {
  name                 = "api-${local.name_prefix}"
  cluster              = aws_ecs_cluster.this.id
  task_definition      = aws_ecs_task_definition.api.arn
  desired_count        = var.api_desired_count
  force_new_deployment = true

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.api.name
    weight            = 1
  }

  deployment_minimum_healthy_percent = var.api_desired_count > 1 ? 50 : 0
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = 60

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = local.container_name
    container_port   = local.container_port
  }

  placement_constraints {
    type       = "memberOf"
    expression = "attribute:role == api"
  }

  ordered_placement_strategy {
    type  = "spread"
    field = "attribute:ecs.availability-zone"
  }

  depends_on = [
    aws_ecs_cluster_capacity_providers.this,
    aws_lb_listener.api,
    aws_iam_role_policy.ecs_task_execution_secrets,
  ]

  lifecycle {
    ignore_changes = [task_definition]
  }

  tags = {
    Name = "svc-api-${local.name_prefix}"
  }
}
