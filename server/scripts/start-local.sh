#!/bin/bash

# Start the application locally with SQLite database
echo "🚀 Starting Application Tracker in local development mode..."

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "📄 Loading environment from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "📄 No .env file found, using default values..."
    echo "💡 Copy env.example to .env to customize settings"
fi

# Set default environment variables for local development
export NODE_ENV=${NODE_ENV:-development}
export USE_LOCAL_DB=${USE_LOCAL_DB:-true}
export API_PORT=${API_PORT:-3001}
export CORS_ORIGIN=${CORS_ORIGIN:-http://localhost:3002}
export LOG_LEVEL=${LOG_LEVEL:-info}

# Create data directory if it doesn't exist
mkdir -p data

echo "📊 Database: SQLite (local development)"
echo "🌐 Server: http://localhost:${API_PORT}"
echo "🔗 CORS Origin: ${CORS_ORIGIN}"
echo "📁 Data Directory: ./data/"
echo "🔧 Environment: ${NODE_ENV}"
echo "📝 Log Level: ${LOG_LEVEL}"
echo ""

# Start the server
npm run dev
