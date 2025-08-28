# Running Application Tracker Locally

This guide will help you run the Application Tracker locally for development without needing Docker or PostgreSQL.

## Quick Start (Recommended)

### Option 1: Quick Setup (Recommended)
```bash
# Make sure you're in the server directory
cd server

# Setup environment configuration
./scripts/setup-env.sh

# Run the local start script
./scripts/start-local.sh
```

### Option 2: Manual Setup
```bash
# Copy environment template
cp env.example .env

# Edit .env file to customize settings
nano .env  # or use your preferred editor

# Start the server
./scripts/start-local.sh
```

### Option 3: Direct Environment Variables
```bash
# Set environment variables directly
export NODE_ENV=development
export USE_LOCAL_DB=true
export API_PORT=3001
export CORS_ORIGIN=http://localhost:3002

# Start the server
npm run dev
```

## What This Does

When you run locally, the application will:

1. **Use SQLite Database**: Automatically creates a local SQLite database file at `./data/applications.db`
2. **Skip Temporal**: Runs in database-only mode (no workflow engine needed)
3. **Use Local Logging**: All logs are written to files in the `./logs/` directory
4. **Enable CORS**: Allows the React frontend to connect from `http://localhost:3002`

## Environment Configuration

The application automatically detects your environment:

- **Local Development**: Uses SQLite database
- **Production/Cloud**: Uses PostgreSQL database

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `USE_LOCAL_DB` | `true` | Force SQLite usage for local development |
| `API_PORT` | `3001` | Server port |
| `CORS_ORIGIN` | `http://localhost:3002` | Frontend URL for CORS |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `GEMINI_API_KEY` | `your_gemini_api_key_here` | For AI-powered cover letters |
| `GEMINI_MODEL` | `gemini-1.5-flash` | AI model to use |
| `EMAIL_SMTP_HOST` | `smtp.gmail.com` | SMTP server for email features |
| `EMAIL_SMTP_PORT` | `587` | SMTP port |
| `EMAIL_SMTP_USER` | `your_email@gmail.com` | SMTP username |
| `EMAIL_SMTP_PASS` | `your_app_password` | SMTP password |
| `EMAIL_FROM` | `your_email@gmail.com` | From email address |
| `EMAIL_TO` | `recipient@example.com` | Default recipient email |

## Database

### Local Development (SQLite)
- **File**: `./data/applications.db`
- **Type**: SQLite (file-based)
- **No Setup Required**: Automatically created
- **Backup**: Just copy the `.db` file

### Production (PostgreSQL)
- **Host**: Configured via environment variables
- **Type**: PostgreSQL (client-server)
- **Setup Required**: Database server needed
- **Backup**: Use PostgreSQL backup tools

## Features Available Locally

✅ **Full CRUD Operations**: Create, read, update, delete applications  
✅ **Search & Filtering**: Search by company, role, status  
✅ **Statistics**: Application analytics and reporting  
✅ **Cover Letter Generation**: AI-powered cover letters (if API key provided)  
✅ **Logging**: Comprehensive logging to files  
✅ **Error Handling**: Proper error responses and logging  

⚠️ **Limited Features**:
- **Email Reminders**: Requires SMTP configuration
- **Workflow Engine**: Temporal workflows disabled (database-only mode)
- **Background Processing**: Some features run synchronously

## Starting the Frontend

In a separate terminal, start the React frontend:

```bash
# From the project root
cd client

# Install dependencies (if not already done)
npm install

# Start the development server
npm start
```

The frontend will run on `http://localhost:3002` and automatically connect to the backend.

## API Endpoints

Once running, you can test the API:

```bash
# Health check
curl http://localhost:3001/health

# Get all applications
curl http://localhost:3001/applications

# Create an application
curl -X POST http://localhost:3001/applications \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Test Company",
    "role": "Software Engineer",
    "jobDescription": "Test job description",
    "resume": "resume.pdf",
    "deadline": "2025-12-31T00:00:00.000Z"
  }'
```

## Logs

All application logs are written to the `./logs/` directory:

- `application-YYYY-MM-DD.log`: Application events
- `api-YYYY-MM-DD.log`: API requests and responses
- `database-YYYY-MM-DD.log`: Database operations
- `error-YYYY-MM-DD.log`: Error logs
- `combined-YYYY-MM-DD.log`: All logs combined

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3001

# Kill the process or use a different port
export API_PORT=3001
```

### Database Issues
```bash
# Remove the database file to start fresh
rm ./data/applications.db

# Restart the application
./scripts/start-local.sh
```

### Permission Issues
```bash
# Make the start script executable
chmod +x scripts/start-local.sh
```

### Frontend Connection Issues
Make sure the CORS origin matches your frontend URL:
```bash
export CORS_ORIGIN=http://localhost:3002
```

## Development Workflow

1. **Start Backend**: `./scripts/start-local.sh`
2. **Start Frontend**: `cd client && npm start`
3. **Make Changes**: Edit code in your preferred editor
4. **Test**: Use the web interface or API endpoints
5. **Check Logs**: Monitor `./logs/` for debugging information

## Switching to Production

When you're ready to deploy:

1. **Set Environment Variables**:
   ```bash
   export NODE_ENV=production
   export DB_HOST=your-postgres-host
   export DB_USER=your-db-user
   export DB_PASSWORD=your-db-password
   export DB_NAME=your-db-name
   ```

2. **Install PostgreSQL**: The application will automatically use PostgreSQL

3. **Deploy**: Use your preferred deployment method (Docker, cloud platform, etc.)

## File Structure

```
server/
├── data/                    # SQLite database (local only)
│   └── applications.db
├── logs/                    # Application logs
│   ├── application-*.log
│   ├── api-*.log
│   └── database-*.log
├── scripts/
│   └── start-local.sh      # Local development script
├── database/
│   ├── queries.js          # PostgreSQL queries
│   ├── dbHelper.js         # PostgreSQL operations
│   └── sqliteHelper.js     # SQLite operations
└── config/
    └── index.js            # Configuration (auto-detects environment)
```

This setup gives you the best of both worlds: easy local development with SQLite and full production capabilities with PostgreSQL!
