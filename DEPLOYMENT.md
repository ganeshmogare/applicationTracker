# 🚀 Deployment Guide

This guide covers deploying the Job Application Tracker to AWS using Infrastructure as Code (Terraform) and CI/CD (GitHub Actions).

## 📋 Prerequisites

### AWS Setup
1. **AWS Account**: Create an AWS account with free tier access
2. **IAM User**: Create an IAM user with programmatic access
3. **Required Permissions**: Attach the following policies to your IAM user:
   - `AmazonECS-FullAccess`
   - `AmazonECR-FullAccess`
   - `AmazonRDS-FullAccess`
   - `AmazonVPCFullAccess`
   - `AmazonEC2FullAccess`
   - `CloudWatchFullAccess`
   - `IAMFullAccess`
   - `AmazonS3FullAccess`

### GitHub Setup
1. **Repository**: Push your code to GitHub
2. **Secrets**: Add the following secrets to your GitHub repository:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `DB_PASSWORD`
   - `EMAIL_SMTP_HOST`
   - `EMAIL_SMTP_USER`
   - `EMAIL_SMTP_PASS`
   - `GEMINI_API_KEY`

## 🏗️ Infrastructure Components

### AWS Services Used
- **ECS Fargate**: Container orchestration
- **ECR**: Container registry
- **RDS PostgreSQL**: Database
- **ALB**: Load balancer
- **VPC**: Networking
- **CloudWatch**: Monitoring
- **S3**: Terraform state storage

### Architecture
```
Internet → ALB → ECS Fargate → RDS PostgreSQL
                ↓
            CloudWatch (Monitoring)
```

## 🚀 Deployment Steps

### 1. Initial Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd applicationTracker

# Install Terraform
brew install terraform  # macOS
# or download from https://terraform.io/downloads.html
```

### 2. Configure AWS Credentials

```bash
# Set up AWS CLI
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

### 3. Create S3 Bucket for Terraform State

```bash
# Create S3 bucket for Terraform state
aws s3 mb s3://job-tracker-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket job-tracker-terraform-state \
  --versioning-configuration Status=Enabled
```

### 4. Deploy Infrastructure

```bash
# Navigate to Terraform directory
cd terraform

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan \
  -var="environment=production" \
  -var="db_password=your-secure-password" \
  -var="email_smtp_host=smtp.gmail.com" \
  -var="email_smtp_user=your-email@gmail.com" \
  -var="email_smtp_pass=your-app-password" \
  -var="gemini_api_key=your-gemini-api-key"

# Apply the configuration
terraform apply
```

### 5. Build and Push Docker Image

```bash
# Build the Docker image
docker build -t job-application-tracker .

# Tag for ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker tag job-application-tracker:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/job-application-tracker:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/job-application-tracker:latest
```

### 6. Update ECS Service

```bash
# Update the ECS service with the new image
aws ecs update-service \
  --cluster production-cluster \
  --service production-app-service \
  --force-new-deployment
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline automatically:

1. **Tests**: Runs unit tests for both frontend and backend
2. **Security Scan**: Scans Docker images for vulnerabilities
3. **Build**: Builds and pushes Docker images to ECR
4. **Deploy**: Deploys to development (develop branch) or production (main branch)
5. **Health Check**: Verifies deployment success
6. **Rollback**: Automatically rolls back on failure

### Pipeline Triggers
- **Push to `develop`**: Deploys to development environment
- **Push to `main`**: Deploys to production environment
- **Pull Request**: Runs tests and security scans

### Manual Deployment

```bash
# Deploy to development
git push origin develop

# Deploy to production
git push origin main
```

## 📊 Monitoring

### CloudWatch Dashboard
Access your CloudWatch dashboard at:
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=production-job-application-tracker-dashboard
```

### Key Metrics
- **ECS**: CPU and Memory utilization
- **ALB**: Request count and response time
- **RDS**: CPU utilization and database connections

### Logs
- **Application Logs**: `/ecs/production-app`
- **RDS Logs**: `/aws/rds/instance/production-db`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `API_PORT` | Application port | `3000` |
| `CORS_ORIGIN` | CORS origin | `*` |
| `DB_HOST` | Database host | `production-db.xxx.us-east-1.rds.amazonaws.com` |
| `DB_PASSWORD` | Database password | `secure-password` |
| `EMAIL_SMTP_HOST` | SMTP host | `smtp.gmail.com` |
| `GEMINI_API_KEY` | Gemini API key | `your-api-key` |

### Scaling

```bash
# Scale ECS service
aws ecs update-service \
  --cluster production-cluster \
  --service production-app-service \
  --desired-count 2
```

## 🛡️ Security

### Security Groups
- **ALB**: Allows HTTP (80) and HTTPS (443)
- **ECS**: Allows traffic from ALB only
- **RDS**: Allows traffic from ECS only

### Secrets Management
- Database passwords stored in Terraform variables
- API keys stored in AWS Systems Manager Parameter Store
- GitHub secrets for sensitive configuration

### Encryption
- RDS storage encrypted at rest
- ALB traffic can be encrypted with SSL certificates
- ECR images encrypted at rest

## 💰 Cost Optimization

### Free Tier Usage
- **ECR**: 500MB storage per month
- **ECS Fargate**: 2 million requests per month
- **RDS**: 750 hours per month (t3.micro)
- **ALB**: 750 hours per month
- **CloudWatch**: 5GB data ingestion per month

### Cost Monitoring
```bash
# Check current costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

## 🚨 Troubleshooting

### Common Issues

1. **ECS Service Not Starting**
   ```bash
   # Check service events
   aws ecs describe-services \
     --cluster production-cluster \
     --services production-app-service
   ```

2. **Database Connection Issues**
   ```bash
   # Check RDS status
   aws rds describe-db-instances \
     --db-instance-identifier production-db
   ```

3. **Load Balancer Health Check Failing**
   ```bash
   # Check target group health
   aws elbv2 describe-target-health \
     --target-group-arn <target-group-arn>
   ```

### Logs
```bash
# View application logs
aws logs tail /ecs/production-app --follow

# View RDS logs
aws logs tail /aws/rds/instance/production-db --follow
```

## 🧹 Cleanup

```bash
# Destroy infrastructure
cd terraform
terraform destroy

# Delete ECR repository
aws ecr delete-repository \
  --repository-name job-application-tracker \
  --force

# Delete S3 bucket
aws s3 rb s3://job-tracker-terraform-state --force
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review CloudWatch logs
3. Check GitHub Actions workflow logs
4. Create an issue in the repository
