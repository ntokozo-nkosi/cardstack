# CardStack API Infrastructure

Terraform for the first AWS deployment of the FastAPI service. The wrapper
supports separate `stg` and `prd` Terraform environments and backend
directories.

## What It Creates

- Small environment VPC in `af-south-1` with four single-AZ tiers:
  `public`, `private`, `isolated`, and `reserved`.
- One NAT Gateway so private ECS hosts can reach ECR, CloudWatch, Doppler, and Neon.
- EC2-backed ECS cluster with one `t4g.micro` Graviton API host by default.
- Internal TCP NLB targeting the API ECS service on dynamic host ports.
- API Gateway HTTP API with a VPC Link to the internal NLB. The default invoke URL is the public HTTPS base URL.
- ECR repository, CloudWatch logs, SSM SecureString for `DOPPLER_TOKEN`, and GitHub OIDC deploy role.

## Required Inputs

Provide these as ordinary Doppler keys in `cardstack-infra/stg` and
`cardstack-infra/prd`. The Makefile runs Terraform with
`doppler run --name-transformer tf-var`, so Doppler maps them to Terraform
variables automatically.

```sh
GITHUB_REPOSITORY="owner/repo"
DOPPLER_TOKEN_API="dp.st.xxxxx"
```

Optional Doppler keys:

```sh
AWS_PROFILE="webbuff-admin"
AWS_REGION="af-south-1"
STATE_BUCKET="webbuff-cardstack-api-terraform-state-stg"
```

The local Makefile fallbacks are:

```sh
DOPPLER_PROJECT=cardstack-infra
AWS_PROFILE_FALLBACK=webbuff-admin
AWS_REGION_FALLBACK=af-south-1
STATE_BUCKET_PREFIX=webbuff-cardstack-api-terraform-state
```

Bucket defaults are derived per env:

| Make env | Terraform env | Default state bucket |
| --- | --- | --- |
| `stg` | `staging` | `webbuff-cardstack-api-terraform-state-stg` |
| `prd` | `production` | `webbuff-cardstack-api-terraform-state-prd` |

Override `STATE_BUCKET` if a default bucket name is unavailable.

Default VPC CIDRs are intentionally small `/20` networks:

| Terraform env | VPC CIDR |
| --- | --- |
| `staging` | `10.80.0.0/20` |
| `production` | `10.80.16.0/20` |

Each tier gets one `/24` subnet in AZ-A. The v1 stack uses an internal NLB
instead of an ALB because this environment is intentionally single-AZ.

## Commands

```sh
make state-bucket ENVIRONMENT=stg
make init ENVIRONMENT=stg
make plan ENVIRONMENT=stg
make apply ENVIRONMENT=stg
```

After apply, store `github_actions_role_arn` as the matching GitHub repository
variable:

- `AWS_STAGING_DEPLOY_ROLE_ARN` for `stg`
- `AWS_PRODUCTION_DEPLOY_ROLE_ARN` for `prd`

The API base URL is `api_gateway_invoke_url`.

## First Deploy Note

Terraform creates the ECS service with an image reference to `:latest`. Before
the first GitHub Actions deploy pushes an image, ECS may report image pull
failures. The first successful deploy tags both the commit SHA and `latest`,
then updates the service to the immutable commit image.
