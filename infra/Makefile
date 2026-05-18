# Environment-aware Terraform wrapper for CardStack API infrastructure.
# Mirrors the NormanSQL.API pattern: each env gets its own backend cache and
# state bucket. Doppler ordinary keys are mapped to TF_VAR_* with
# --name-transformer tf-var for Terraform commands.

DOPPLER_PROJECT ?= cardstack-infra
AWS_PROFILE_FALLBACK ?= webbuff-admin
AWS_REGION_FALLBACK ?= af-south-1
STATE_BUCKET_PREFIX ?= webbuff-cardstack-api-terraform-state

# Only honour ENVIRONMENT when set on the make command line. This avoids stale
# shell exports accidentally targeting the wrong stack.
ENVIRONMENT_ARG := $(if $(filter command line,$(origin ENVIRONMENT)),$(ENVIRONMENT),)

SELECT_ENV = \
	env="$(ENVIRONMENT_ARG)"; \
	if [ -z "$$env" ]; then \
		printf "Environment (stg/prd): "; \
		read -r env; \
	fi; \
	case "$$env" in \
		stg) tf_environment=staging;     doppler_config=stg; state_suffix=stg ;; \
		prd) tf_environment=production;  doppler_config=prd; state_suffix=prd ;; \
		*)   echo "Unknown environment '$$env'. Expected stg or prd." >&2; exit 1 ;; \
	esac; \
	tf_data_dir=".terraform-$$env"; \
	doppler_project="$(DOPPLER_PROJECT)"; \
	aws_profile="$(AWS_PROFILE)"; \
	[ -n "$$aws_profile" ] || aws_profile="$$(doppler secrets get AWS_PROFILE --plain --project "$$doppler_project" --config "$$doppler_config" 2>/dev/null || true)"; \
	[ -n "$$aws_profile" ] || aws_profile="$(AWS_PROFILE_FALLBACK)"; \
	aws_region="$(AWS_REGION)"; \
	[ -n "$$aws_region" ] || aws_region="$$(doppler secrets get AWS_REGION --plain --project "$$doppler_project" --config "$$doppler_config" 2>/dev/null || true)"; \
	[ -n "$$aws_region" ] || aws_region="$(AWS_REGION_FALLBACK)"; \
	tf_state_bucket="$(STATE_BUCKET)"; \
	[ -n "$$tf_state_bucket" ] || tf_state_bucket="$$(doppler secrets get STATE_BUCKET --plain --project "$$doppler_project" --config "$$doppler_config" 2>/dev/null || true)"; \
	[ -n "$$tf_state_bucket" ] || tf_state_bucket="$(STATE_BUCKET_PREFIX)-$$state_suffix"; \
	echo "Environment: $$env ($$tf_environment), Doppler: $$doppler_project/$$doppler_config, AWS profile: $$aws_profile, region: $$aws_region, state bucket: $$tf_state_bucket, TF data dir: $$tf_data_dir"

ENSURE_INIT = \
	if [ ! -f "$$tf_data_dir/terraform.tfstate" ]; then \
		printf '\nBackend not initialized for %s (no %s/terraform.tfstate).\nRun this first:\n  make init ENVIRONMENT=%s\n\n' "$$env" "$$tf_data_dir" "$$env" >&2; \
		exit 1; \
	fi

TF_ENV = TF_DATA_DIR=$$tf_data_dir AWS_PROFILE=$$aws_profile AWS_REGION=$$aws_region
TF_RUN = $(TF_ENV) DOPPLER_TOKEN=$${DOPPLER_TOKEN:-$$(doppler configure get token --plain 2>/dev/null || true)} \
	doppler run --project $$doppler_project --config $$doppler_config --name-transformer tf-var -- \
	env TF_VAR_environment=$$tf_environment TF_VAR_aws_region=$$aws_region terraform

.PHONY: state-bucket init plan apply validate fmt output

state-bucket:
	@$(SELECT_ENV); \
	export AWS_PROFILE="$$aws_profile" AWS_REGION="$$aws_region"; \
	aws s3api head-bucket --bucket "$$tf_state_bucket" >/dev/null 2>&1 \
		|| aws s3api create-bucket --bucket "$$tf_state_bucket" --region "$$aws_region" --create-bucket-configuration LocationConstraint="$$aws_region"; \
	aws s3api put-bucket-versioning --bucket "$$tf_state_bucket" --versioning-configuration Status=Enabled; \
	aws s3api put-bucket-encryption --bucket "$$tf_state_bucket" --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'; \
	aws s3api put-public-access-block --bucket "$$tf_state_bucket" --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

init:
	@$(SELECT_ENV); \
	$(TF_ENV) terraform init -reconfigure \
		-backend-config="bucket=$$tf_state_bucket" \
		-backend-config="key=terraform.tfstate" \
		-backend-config="region=$$aws_region"

plan:
	@$(SELECT_ENV); $(ENSURE_INIT); $(TF_RUN) plan

apply:
	@$(SELECT_ENV); $(ENSURE_INIT); $(TF_RUN) apply

validate:
	@$(SELECT_ENV); $(ENSURE_INIT); $(TF_RUN) validate

output:
	@$(SELECT_ENV); $(ENSURE_INIT); $(TF_ENV) terraform output

fmt:
	@terraform fmt -recursive
