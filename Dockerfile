# Multi-stage build for the entire application
FROM node:18-alpine AS base

# Install dependencies for both client and server
WORKDIR /app

# Copy package files
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --prefix client && npm ci --prefix server

# Build stage for client
FROM base AS client-build
WORKDIR /app/client
COPY client/ ./
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Copy built client
COPY --from=client-build /app/client/build ./client/build

# Copy server files
COPY server/ ./server/

# Install only production dependencies for server
WORKDIR /app/server
RUN npm ci --only=production

# Expose server port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the server
CMD ["npm", "start"]
