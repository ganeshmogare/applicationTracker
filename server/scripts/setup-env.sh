#!/bin/bash

# Setup environment file for local development
echo "🔧 Setting up environment configuration..."

# Check if .env file already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled. Your existing .env file was preserved."
        exit 1
    fi
fi

# Copy the example file
if [ -f env.example ]; then
    cp env.example .env
    echo "✅ Created .env file from env.example"
else
    echo "❌ env.example file not found!"
    exit 1
fi

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env file to customize your settings"
echo "2. Run './scripts/start-local.sh' to start the application"
echo ""
echo "💡 Key settings you might want to change:"
echo "   - API_PORT: Server port (default: 3001)"
echo "   - CORS_ORIGIN: Frontend URL (default: http://localhost:3001)"
echo "   - GEMINI_API_KEY: For AI features (optional)"
echo "   - EMAIL_*: For email features (optional)"
echo ""
