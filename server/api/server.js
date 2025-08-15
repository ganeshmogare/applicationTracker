const express = require('express');
const bodyParser = require('body-parser');
const { Connection, WorkflowClient } = require('@temporalio/client');
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

  // Serve static files from React build in production
  if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    app.use(express.static(path.join(__dirname, '../../client/build')));
  }

  let connection, client;
  try {
    connection = await Connection.connect({ address: config.temporal.address });
    client = new WorkflowClient({ connection });
    console.log('✅ Connected to Temporal server');
  } catch (error) {
    console.log('⚠️ Temporal server not available, running in database-only mode');
    connection = null;
    client = null;
  }

  app.post('/applications', async (req, res) => {
    try {
      const { company, role, jobDescription, resume, deadline } = req.body;
      // Default deadline to 4 weeks if not provided
      const resolvedDeadline = deadline || new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString();

      let workflowId = `app_${Date.now()}`;
      
      // Start Temporal workflow if available
      if (client) {
        try {
          const handle = await client.start('applicationWorkflow', {
            taskQueue: 'applicationQueue',
            workflowId: workflowId,
            args: [{ company, role, jobDescription, resume, deadline: resolvedDeadline }],
          });
          workflowId = handle.workflowId;
        } catch (error) {
          console.log('⚠️ Temporal workflow failed, continuing with database only');
        }
      }

      // Store the application in database
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

  app.get('/applications', async (req, res) => {
    try {
      const applicationsList = await db.getAllApplications();
      res.json(applicationsList);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ error: 'Failed to fetch applications' });
    }
  });

  app.post('/applications/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      const workflowId = req.params.id;
      
      // Update the application in database
      await db.updateApplicationStatus(workflowId, status);

      // Send signal to Temporal workflow if available
      if (client) {
        try {
          const handle = client.getHandle(workflowId);
          await handle.signal('updateStatus', status);
        } catch (error) {
          console.log('⚠️ Temporal signal failed, continuing with database only');
        }
      }
      res.json({ message: 'Status updated successfully' });
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ error: 'Failed to update status' });
    }
  });

  // Get archived applications - MOVED BEFORE /applications/:id
  app.get('/applications/archived', async (req, res) => {
    try {
      const archivedList = await db.getArchivedApplications();
      res.json(archivedList);
    } catch (error) {
      console.error('Error fetching archived applications:', error);
      res.status(500).json({ error: 'Failed to fetch archived applications' });
    }
  });

  // Optional: expose workflow state via query for UI
  app.get('/applications/:id', async (req, res) => {
    try {
      const workflowId = req.params.id;
      const application = await db.getApplicationById(workflowId);
      if (application) {
        return res.json(application);
      }
      res.status(404).json({ error: 'Not found' });
    } catch (error) {
      console.error('Error fetching application:', error);
      res.status(500).json({ error: 'Failed to fetch application' });
    }
  });

  // Regenerate cover letter for an application
  app.post('/applications/:id/regenerate-cover-letter', async (req, res) => {
    try {
      const workflowId = req.params.id;
      
      // Get the application data
      const application = await db.getApplicationById(workflowId);
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      console.log(`Starting cover letter generation for ${application.company} - ${application.role}`);
      
      // Import and use the LLM activities
      const { generateCoverLetter, updateCoverLetter } = require('../activities/llmActivities');
      
      // Generate the cover letter
      const coverLetter = await generateCoverLetter(application);
      
      // Update the database with the new cover letter
      await updateCoverLetter(workflowId, coverLetter);
      
      res.json({ 
        message: 'Cover letter generated successfully',
        coverLetter: coverLetter
      });
    } catch (error) {
      console.error('Error in regenerate cover letter endpoint:', error);
      res.status(500).json({ error: 'Failed to generate cover letter' });
    }
  });

  // Add this endpoint for background generation
  app.post('/applications/:id/generate-cover-letter-background', async (req, res) => {
    try {
      const workflowId = req.params.id;
      
      // Get the application data
      const application = await db.getApplicationById(workflowId);
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      console.log(`Starting background cover letter generation for ${application.company} - ${application.role}`);
      
      // Import and use the LLM activities
      const { generateCoverLetter, updateCoverLetter } = require('../activities/llmActivities');
      
      // Start the generation in the background (don't await)
      generateCoverLetter(application).then(async (coverLetter) => {
        try {
          await updateCoverLetter(workflowId, coverLetter);
          console.log('Background cover letter generation completed successfully');
        } catch (error) {
          console.error('Error updating cover letter in background:', error);
        }
      }).catch((error) => {
        console.error('Error in background cover letter generation:', error);
      });
      
      res.json({ 
        message: 'Cover letter generation started in background',
        note: 'The cover letter will be generated and saved automatically'
      });
    } catch (error) {
      console.error('Error in background generation endpoint:', error);
      res.status(500).json({ error: 'Failed to start background generation' });
    }
  });

  // Health check endpoint for cloud deployment
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Test email functionality
  app.post('/test-email', async (req, res) => {
    try {
      const { sendReminder } = require('../activities/llmActivities');
      
      const testApplication = {
        company: 'Test Company',
        role: 'Test Role',
        deadline: new Date().toISOString()
      };
      
      console.log('Testing email functionality...');
      const result = await sendReminder(testApplication, 'test');
      
      res.json({ 
        message: 'Email test completed',
        result: result,
        note: 'Check your email inbox for the test message'
      });
    } catch (error) {
      console.error('Error testing email:', error);
      res.status(500).json({ error: 'Failed to test email functionality' });
    }
  });

  // Serve React app for the root path and other non-API routes in production
  if (process.env.NODE_ENV === 'production') {
    app.get('/', (req, res) => {
      try {
        res.sendFile(path.join(__dirname, '../../client/build/index.html'));
      } catch (error) {
        console.error('Error serving React app:', error);
        res.status(500).json({ error: 'Failed to serve application' });
      }
    });
    
    // Catch-all for other non-API routes (but not /applications/*)
    app.get('*', (req, res) => {
      if (req.path.startsWith('/applications')) {
        return res.status(404).json({ error: 'Not found' });
      }
      try {
        res.sendFile(path.join(__dirname, '../../client/build/index.html'));
      } catch (error) {
        console.error('Error serving React app:', error);
        res.status(500).json({ error: 'Failed to serve application' });
      }
    });
  }

  app.listen(config.server.port, () => {
    console.log(`Server running at http://localhost:${config.server.port}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`Environment variables:`, {
      NODE_ENV: process.env.NODE_ENV,
      DB_HOST: process.env.DB_HOST,
      DB_NAME: process.env.DB_NAME,
      SERVER_PORT: process.env.SERVER_PORT,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'MISSING',
      GEMINI_MODEL: process.env.GEMINI_MODEL,
      EMAIL_SMTP_HOST: process.env.EMAIL_SMTP_HOST ? 'SET' : 'MISSING',
      EMAIL_SMTP_USER: process.env.EMAIL_SMTP_USER ? 'SET' : 'MISSING',
      EMAIL_SMTP_PASS: process.env.EMAIL_SMTP_PASS ? 'SET' : 'MISSING',
      EMAIL_FROM: process.env.EMAIL_FROM,
      EMAIL_TO: process.env.EMAIL_TO
    });
  });
}

startServer().catch(console.error);
