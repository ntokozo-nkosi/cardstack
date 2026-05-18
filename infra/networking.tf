resource "aws_vpc" "this" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-${local.name_prefix}"
  }
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = "igw-${local.name_prefix}"
  }
}

resource "aws_subnet" "this" {
  for_each = local.subnets

  vpc_id                  = aws_vpc.this.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = each.value.tier == "public"

  tags = {
    Name = "sn-${each.value.tier}-${upper(each.value.az_suffix)}-${local.name_prefix}"
    Tier = each.value.tier
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = {
    Name = "rt-public-${local.name_prefix}"
    Tier = "public"
  }
}

resource "aws_route_table_association" "public" {
  for_each = {
    for name, subnet in aws_subnet.this : name => subnet
    if local.subnets[name].tier == "public"
  }

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "eip-nat-${local.name_prefix}"
  }
}

resource "aws_nat_gateway" "this" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.this["public-a"].id

  depends_on = [aws_internet_gateway.this]

  tags = {
    Name = "nat-${local.name_prefix}"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.this.id
  }

  tags = {
    Name = "rt-private-${local.name_prefix}"
    Tier = "private"
  }
}

resource "aws_route_table_association" "private" {
  for_each = {
    for name, subnet in aws_subnet.this : name => subnet
    if local.subnets[name].tier == "private"
  }

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private.id
}
