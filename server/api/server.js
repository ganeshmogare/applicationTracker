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

  const connection = await Connection.connect({ address: config.temporal.address });
  const client = new WorkflowClient({ connection });

  app.post('/applications', async (req, res) => {
    try {
      const { company, role, jobDescription, resume, deadline } = req.body;
      // Default deadline to 4 weeks if not provided
      const resolvedDeadline = deadline || new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString();

      const handle = await client.start('applicationWorkflow', {
        taskQueue: 'applicationQueue',
        workflowId: `app_${Date.now()}`,
        args: [{ company, role, jobDescription, resume, deadline: resolvedDeadline }],
      });

      // Store the application in database
      const application = {
        workflowId: handle.workflowId,
        company,
        role,
        jobDescription,
        resume,
        deadline: resolvedDeadline,
        status: 'Applied'
      };

      await db.createApplication(application);

      res.json({ workflowId: handle.workflowId });
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

  app.post('/applications/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      const workflowId = req.params.id;
      
      // Update the application in database
      await db.updateApplicationStatus(workflowId, status);

      // Send signal to Temporal workflow
      const handle = client.getHandle(workflowId);
      await handle.signal('updateStatus', status);
      
      res.json({ message: 'Status updated successfully' });
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ error: 'Failed to update status' });
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
      
      // Generate new cover letter
      const { generateCoverLetter } = require('../activities/llmActivities');
      const coverLetter = await generateCoverLetter({
        company: application.company,
        role: application.role,
        jobDescription: application.job_description,
        resume: application.resume
      });

      console.log(`Cover letter generated successfully for ${application.company} - ${application.role}`);

      // Store the new cover letter
      await db.updateCoverLetter(workflowId, coverLetter);

      res.json({ 
        message: 'Cover letter regenerated successfully',
        coverLetter 
      });
    } catch (error) {
      console.error('Error regenerating cover letter:', error);
      res.status(500).json({ error: 'Failed to regenerate cover letter' });
    }
  });

  // Add this endpoint for background generation
  app.post('/applications/:id/generate-cover-letter-background', async (req, res) => {
    try {
      const workflowId = req.params.id;
      
      // Return immediately
      res.json({ message: 'Cover letter generation started in background' });
      
      // Generate in background
      setTimeout(async () => {
        try {
          const application = await db.getApplicationById(workflowId);
          if (application) {
            const { generateCoverLetter } = require('../activities/llmActivities');
            const coverLetter = await generateCoverLetter({
              company: application.company,
              role: application.role,
              jobDescription: application.job_description,
              resume: application.resume
            });
            await db.updateCoverLetter(workflowId, coverLetter);
            console.log(`Background cover letter generated for ${application.company}`);
          }
        } catch (error) {
          console.error('Background cover letter generation failed:', error);
        }
      }, 100);
      
    } catch (error) {
      console.error('Error starting background generation:', error);
    }
  });

  app.listen(config.server.port, () => {
    console.log(`Server running at http://localhost:${config.server.port}`);
  });
}

startServer().catch(console.error);
