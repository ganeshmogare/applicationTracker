#!/bin/bash

# AWS Infrastructure Setup Script for Job Application Tracker
set -e

echo "🚀 Setting up AWS infrastructure for Job Application Tracker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform is not installed. Please install it first.${NC}"
    echo "Visit: https://developer.hashicorp.com/terraform/downloads"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites are installed${NC}"

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="us-east-1"
PROJECT_NAME="job-application-tracker"
S3_BUCKET="job-tracker-terraform-state-${ACCOUNT_ID}"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  AWS Account ID: $ACCOUNT_ID"
echo "  Region: $REGION"
echo "  Project: $PROJECT_NAME"
echo "  S3 Bucket: $S3_BUCKET"

# Create S3 bucket for Terraform state
echo -e "\n${YELLOW}📦 Creating S3 bucket for Terraform state...${NC}"
if aws s3 ls "s3://$S3_BUCKET" 2>&1 > /dev/null; then
    echo -e "${GREEN}✅ S3 bucket already exists${NC}"
else
    aws s3 mb "s3://$S3_BUCKET" --region $REGION
    aws s3api put-bucket-versioning \
        --bucket $S3_BUCKET \
        --versioning-configuration Status=Enabled
    echo -e "${GREEN}✅ S3 bucket created successfully${NC}"
fi

# Create ECR repository
echo -e "\n${YELLOW}🐳 Creating ECR repository...${NC}"
if aws ecr describe-repositories --repository-names $PROJECT_NAME 2>&1 > /dev/null; then
    echo -e "${GREEN}✅ ECR repository already exists${NC}"
else
    aws ecr create-repository --repository-name $PROJECT_NAME --region $REGION
    echo -e "${GREEN}✅ ECR repository created successfully${NC}"
fi

# Get ECR repository URI
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$PROJECT_NAME"

echo -e "\n${YELLOW}🔧 Building and pushing Docker image...${NC}"

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI

# Build Docker image
docker build -t $PROJECT_NAME .

# Tag and push image
docker tag $PROJECT_NAME:latest $ECR_URI:latest
docker push $ECR_URI:latest

echo -e "${GREEN}✅ Docker image pushed successfully${NC}"

# Initialize Terraform
echo -e "\n${YELLOW}🏗️ Initializing Terraform...${NC}"
cd terraform
terraform init

echo -e "\n${YELLOW}📋 Next steps:${NC}"
echo "1. Configure your environment variables:"
echo "   - Copy env.production.example to .env.production"
echo "   - Fill in your actual values"
echo ""
echo "2. Deploy infrastructure:"
echo "   cd terraform"
echo "   terraform plan -var='environment=production' -var='db_password=your-password'"
echo "   terraform apply"
echo ""
echo "3. Set up GitHub secrets:"
echo "   - AWS_ACCESS_KEY_ID"
echo "   - AWS_SECRET_ACCESS_KEY"
echo "   - DB_PASSWORD"
echo "   - EMAIL_SMTP_HOST"
echo "   - EMAIL_SMTP_USER"
echo "   - EMAIL_SMTP_PASS"
echo "   - GEMINI_API_KEY"
echo ""
echo "4. Push to GitHub to trigger CI/CD:"
echo "   git push origin main"
echo ""
echo -e "${GREEN}🎉 Setup completed!${NC}"
echo -e "Your application will be available at: http://<alb-dns-name>"
