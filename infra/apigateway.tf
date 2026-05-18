resource "aws_apigatewayv2_api" "api" {
  name          = "http-${local.name_prefix}"
  protocol_type = "HTTP"

  tags = {
    Name = "http-${local.name_prefix}"
  }
}

resource "aws_apigatewayv2_vpc_link" "api" {
  name               = "vpclink-${local.name_prefix}"
  security_group_ids = [aws_security_group.api_gateway_vpc_link.id]
  subnet_ids         = [for suffix in local.az_suffixes : aws_subnet.this["private-${suffix}"].id]

  tags = {
    Name = "vpclink-${local.name_prefix}"
  }
}

resource "aws_apigatewayv2_integration" "api" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "HTTP_PROXY"
  integration_method     = "ANY"
  integration_uri        = aws_lb_listener.api.arn
  connection_type        = "VPC_LINK"
  connection_id          = aws_apigatewayv2_vpc_link.api.id
  payload_format_version = "1.0"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 100
    throttling_rate_limit  = 50
  }

  tags = {
    Name = "stage-default-${local.name_prefix}"
  }
}
