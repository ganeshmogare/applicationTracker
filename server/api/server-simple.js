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
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  
  app.use(bodyParser.json());

  // Basic endpoints
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  app.get('/applications', async (req, res) => {
    try {
      const applicationsList = await db.getAllApplications();
      res.json(applicationsList);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ error: 'Failed to fetch applications' });
    }
  });

  app.post('/applications', async (req, res) => {
    try {
      const { company, role, jobDescription, resume, deadline } = req.body;
      const resolvedDeadline = deadline || new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString();
      const workflowId = `app_${Date.now()}`;

      const application = {
        workflowId: workflowId,
        company,
        role,
        jobDescription,
        resume,
        deadline: resolvedDeadline,
        status: 'Applied'
      };

      await db.createApplication(application);
      res.json({ workflowId: workflowId });
    } catch (error) {
      console.error('Error creating application:', error);
      res.status(500).json({ error: 'Failed to create application' });
    }
  });

  // Serve React app for all non-API routes in production
  if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    app.get('*', (req, res) => {
      try {
        res.sendFile(path.join(__dirname, '../client/build/index.html'));
      } catch (error) {
        console.error('Error serving React app:', error);
        res.status(500).json({ error: 'Failed to serve application' });
      }
    });
  }

  app.listen(config.server.port, () => {
    console.log(`Server running at http://localhost:${config.server.port}`);
  });
}

startServer().catch(console.error);
