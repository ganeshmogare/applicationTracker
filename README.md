# Job Application Tracker

A modern web application for tracking job applications with automated cover letter generation using Temporal workflows.

## Features

- 📝 **Submit Job Applications** - Easy form to submit new job applications
- 🤖 **AI-Powered Cover Letters** - Automated cover letter generation using LLM
- ⏰ **Deadline Tracking** - Automatic tracking of application deadlines
- 📊 **Status Management** - Update application status (Applied, Interview, Rejected, Accepted)
- 🔄 **Workflow Orchestration** - Powered by Temporal for reliable job processing
- 🎨 **Modern UI** - Beautiful, responsive React frontend

## Architecture

- **Frontend**: React.js with modern CSS
- **Backend**: Node.js with Express
- **Workflow Engine**: Temporal
- **AI Integration**: LLM for cover letter generation

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Docker (for Temporal server)

## Quick Start

### 1. Start Temporal Server

The application uses Temporal for workflow orchestration. You can start it using Docker:

```bash
# Navigate to the docker-compose directory
cd docker-compose

# Start Temporal with PostgreSQL
docker-compose -f docker-compose-postgres.yml up -d
```

## 🚀 Cloud Deployment

### Option 1: AWS with Infrastructure as Code (Recommended)

#### Prerequisites
- AWS Account with free tier access
- AWS CLI, Terraform, and Docker installed
- GitHub repository with secrets configured

#### Quick Setup
```bash
# Run the automated setup script
./setup-aws.sh

# Follow the prompts to configure your environment
```

#### Manual Setup
```bash
# 1. Configure AWS credentials
aws configure

# 2. Create S3 bucket for Terraform state
aws s3 mb s3://job-tracker-terraform-state --region us-east-1

# 3. Deploy infrastructure
cd terraform
terraform init
terraform plan -var="environment=production" -var="db_password=your-password"
terraform apply

# 4. Push to GitHub to trigger CI/CD
git push origin main
```

#### CI/CD Pipeline
- **Automatic deployment** on push to `main` branch
- **Security scanning** with Trivy
- **Health checks** and automatic rollback
- **Multi-environment** support (dev/prod)

### Option 2: Docker Compose (Local/Simple)

#### Prerequisites
- Docker and Docker Compose installed
- Environment variables configured (see `env.production.example`)

#### Quick Deployment
```bash
# 1. Configure environment variables
cp env.production.example .env.production
# Edit .env.production with your values

# 2. Deploy
./deploy.sh
```

#### Manual Deployment
```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### Supported Cloud Platforms
- **AWS**: ECS Fargate with ALB and RDS (IaC provided)
- **Google Cloud**: Cloud Run or GKE
- **Azure**: Container Instances or AKS
- **DigitalOcean**: App Platform or Droplets
- **Heroku**: Container Registry and Dynos

### 2. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Start the Application

#### Option A: Start Backend and Worker Separately

```bash
# Terminal 1: Start the API server
cd server
npm run start

# Terminal 2: Start the Temporal worker
cd server
npm run worker
```

#### Option B: Start Both Together

```bash
# Start both server and worker concurrently
cd server
npm run dev
```

#### Start Frontend

```bash
# Terminal 3: Start the React frontend
cd client
npm start
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3000
- **Temporal UI**: http://localhost:8233

## Usage

1. **Submit a New Application**:
   - Fill out the application form with company, role, job description, resume, and deadline
   - Click "Submit Application"
   - The system will automatically generate a cover letter using AI

2. **Track Applications**:
   - View all your submitted applications
   - Update application status using the status buttons
   - Monitor deadlines and application progress

3. **Workflow Management**:
   - Applications are processed through Temporal workflows
   - Automatic deadline tracking with grace periods
   - Status updates are handled through workflow signals

## API Endpoints

- `POST /applications` - Submit a new job application
- `GET /applications` - Get all applications
- `POST /applications/:id/status` - Update application status

## Configuration

### LLM Integration

The application currently uses a mock LLM service for cover letter generation. To integrate with a real LLM service:

1. Update the `generateCoverLetter` function in `server/activities/llmActivities.js`
2. Replace the mock API call with your preferred LLM service (e.g., OpenAI, Gemini, etc.)
3. Add your API keys to environment variables

### Environment Variables

Create a `.env` file in the server directory:

```env
# LLM API Configuration
LLM_API_KEY=your_api_key_here
LLM_API_URL=https://api.openai.com/v1/chat/completions

# Temporal Configuration
TEMPORAL_HOST=localhost:7233
```

## Development

### Project Structure

```
applicationTracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.js         # Main application component
│   │   └── App.css        # Styling
│   └── package.json
├── server/                 # Node.js backend
│   ├── api/
│   │   └── server.js      # Express API server
│   ├── activities/
│   │   └── llmActivities.js # LLM integration
│   ├── workflows/
│   │   └── applicationWorkflow.js # Temporal workflows
│   ├── worker.js          # Temporal worker
│   └── package.json
└── docker-compose/         # Docker configuration for Temporal
```

### Adding New Features

1. **New Workflow Activities**: Add to `server/activities/`
2. **New Workflows**: Add to `server/workflows/`
3. **API Endpoints**: Add to `server/api/server.js`
4. **UI Components**: Add to `client/src/`

## Troubleshooting

### Common Issues

1. **Temporal Connection Error**:
   - Ensure Temporal server is running: `docker ps`
   - Check Temporal UI at http://localhost:8233

2. **CORS Errors**:
   - Backend CORS is configured for http://localhost:3000
   - Ensure frontend is running on the correct port

3. **Worker Not Processing**:
   - Check worker logs for errors
   - Ensure workflow and activity files are properly exported

### Logs

- **API Server**: Check terminal running `npm run start`
- **Worker**: Check terminal running `npm run worker`
- **Temporal**: Check Docker logs or Temporal UI

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
