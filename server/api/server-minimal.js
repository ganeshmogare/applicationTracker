const express = require('express');
const bodyParser = require('body-parser');
const config = require('../config');
const db = require('../database');

async function startServer() {
  const app = express();

  // Initialize database
  await db.initializeDatabase();

  // Enable CORS for frontend
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', config.server.corsOrigin);
    res.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  app.use(bodyParser.json());

  // Only basic health endpoint
  app.get('/health', (req, res) => {
    res
      .status(200)
      .json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Simple catch-all for React app
  app.get('*', (req, res) => {
    res.status(200).json({ message: 'Application is running', path: req.path });
  });

  app.listen(config.server.port, () => {
    console.log(`Server running at http://localhost:${config.server.port}`);
  });
}

startServer().catch(console.error);
