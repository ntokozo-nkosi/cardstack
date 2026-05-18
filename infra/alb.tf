resource "aws_security_group" "api_gateway_vpc_link" {
  name_prefix = "apigw-vpclink-${local.name_prefix}-"
  description = "Security group for API Gateway VPC Link ENIs"
  vpc_id      = aws_vpc.this.id

  egress {
    description = "Allow API Gateway VPC Link to reach the internal load balancer"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [local.vpc_cidr]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "sg-apigw-vpclink-${local.name_prefix}"
  }
}

resource "aws_lb" "api" {
  name               = "nlb-${local.name_prefix}"
  internal           = true
  load_balancer_type = "network"
  subnets            = [for suffix in local.az_suffixes : aws_subnet.this["private-${suffix}"].id]

  tags = {
    Name = "nlb-${local.name_prefix}"
  }
}

resource "aws_lb_target_group" "api" {
  name        = "tg-${local.name_prefix}"
  port        = local.container_port
  protocol    = "TCP"
  target_type = "instance"
  vpc_id      = aws_vpc.this.id

  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = local.health_check_path
    port                = "traffic-port"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 15
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = {
    Name = "tg-${local.name_prefix}"
  }
}

resource "aws_lb_listener" "api" {
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  tags = {
    Name = "listener-nlb-${local.name_prefix}"
  }
}
