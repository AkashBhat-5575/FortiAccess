# Generated Terraform MVPs

A/main.tf = Traditional; B/main.tf = Containerized; C/main.tf = Serverless.
These files are generated release snapshots of backend/app/templates. The UI/API always generates from those templates. Do not treat the snapshots as a separate model to maintain.

Each configuration passed Terraform 1.9.8 `init -backend=false` and `validate` using the AWS 5.x provider. Validation checks configuration/provider schemas, not actual AWS permissions, quotas, networking, application readiness or price. No `plan`/`apply` against an AWS account was executed.

## Serverless

C/lambda.zip packages backend/examples/lambda_function.py. It validates the CloudFront origin secret and returns a real DynamoDB item for GET ?id=<record-id>, 404 for missing records, 400 for absent ID, and 405 for unsupported methods. It does not invent records or claim end-user authentication.

```bash
cd terraform/C
terraform init
terraform validate
# Configure an encrypted remote state backend before any real apply.
# Supply origin_secret securely via your Terraform workflow, not committed tfvars.
terraform plan
```
Set lambda_zip to your own artifact if replacing the example. Your AWS region and credentials must be configured. CloudFront → HTTP API Gateway → Lambda → DynamoDB; IAM runtime role and CloudWatch logging are included. The API stage throttles requests. Caller identity/authorization and a WAF are not implemented or claimed.

## Traditional / containerized

These reference an existing network with public ALB subnets and private compute/RDS subnets across at least two AZs. You must supply:
- vpc_id, public_subnet_ids, private_subnet_ids (with NAT/endpoints/outbound connectivity).
- Regional ACM certificate_arn, origin_domain and hosted_zone_id that you control.
- A strong database_password and origin_secret (both sensitive; both remain in Terraform state).
- A: application_user_data that boots your real application on port 8080, exposes /health, uses the RDS output with TLS and configures CloudWatch logging.
- B: container_image for that application, with /health on port 8080. DB_HOST/DB_NAME/DB_USER and SSM DB_PASSWORD are configured; application must enforce DB TLS.

A deploys an EC2 launch template/ASG; B deploys ECS/Fargate tasks/service. Both have scaling policies, regional HTTPS ALB origins, a Route 53 record, CloudFront secret-header validation, Multi-AZ encrypted/private RDS and security groups. B also uses an encrypted SSM parameter for DB credentials. Required network/DNS/certificate prerequisites are deliberately not silently provisioned as a large platform.

## Limitations and safety

Defaults are MVP provisioning, not automatic workload-sized deployment. Capacity estimates and real throughput differ; load-test and price actual service configurations. ALB-to-compute is HTTP inside the VPC; configure end-to-end TLS for sensitive production data. CloudFront origin secret is not end-user authorization. Multi-AZ RDS has deletion protection and a final snapshot; plan retention and teardown deliberately. VM logging depends on the supplied bootstrap.

Keep Terraform state encrypted and access-restricted. Review IAM, TLS, application security, backups, organization policies, quotas and costs before apply. Network provisioning, production identity, WAF and CloudTrail are out of this MVP and are not falsely shown as deployed.
