#!/bin/bash

set -e

# Configuration
APP_NAME="email-automation"
AWS_REGION="us-east-1"
ECR_REPO_NAME="email-automation"

echo "🚀 Starting deployment of Email Automation App to AWS..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create ECR repository if it doesn't exist
echo "📦 Creating ECR repository..."
aws ecr describe-repositories --repository-names $ECR_REPO_NAME --region $AWS_REGION > /dev/null 2>&1 || \
aws ecr create-repository --repository-name $ECR_REPO_NAME --region $AWS_REGION

# Login to ECR
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push Docker image
echo "🔨 Building Docker image..."
docker build -t $ECR_REPO_NAME:latest .
docker tag $ECR_REPO_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:latest

echo "📤 Pushing image to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME:latest

# Deploy infrastructure with Terraform
echo "🏗️  Deploying infrastructure..."
cd terraform
terraform init
terraform plan -var="aws_region=$AWS_REGION"
terraform apply -auto-approve -var="aws_region=$AWS_REGION"

echo "✅ Deployment completed successfully!"
echo "🌐 Your application will be available at the Load Balancer DNS name shown above."