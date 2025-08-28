const express = require('express');
const config = require('../config');
const db = require('../database');

async function startServer() {
  const app = express();

  // Initialize database
  await db.initializeDatabase();

  // Basic middleware
  app.use(express.json());

  // Simple health endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Simple catch-all for React app
  app.get('*', (req, res) => {
    res.json({ message: 'Application is running', path: req.path });
  });

  app.listen(config.server.port, () => {
    console.log(`Server running at http://localhost:${config.server.port}`);
  });
}

startServer().catch(console.error);
