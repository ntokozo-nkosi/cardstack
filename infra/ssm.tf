resource "aws_ssm_parameter" "doppler_token" {
  name  = "/${var.project}/${var.environment}/doppler-token"
  type  = "SecureString"
  value = var.doppler_token_api

  tags = {
    Name = "doppler-token-${local.name_prefix}"
  }
}
