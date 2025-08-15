const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  // Add connection retry settings
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
});

// Initialize database tables with retry
async function initializeDatabase() {
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to connect to database (attempt ${attempt}/${maxRetries})...`);
      const client = await pool.connect();
      
      // Create table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS applications (
          id SERIAL PRIMARY KEY,
          workflow_id VARCHAR(255) UNIQUE NOT NULL,
          company VARCHAR(255) NOT NULL,
          role VARCHAR(255) NOT NULL,
          job_description TEXT,
          resume TEXT,
          deadline TIMESTAMP,
          status VARCHAR(50) DEFAULT 'Applied',
          archived BOOLEAN DEFAULT FALSE,
          cover_letter TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Check if cover_letter column exists, add it if it doesn't
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'applications' AND column_name = 'cover_letter'
      `);
      
      if (columnCheck.rows.length === 0) {
        console.log('Adding cover_letter column to existing applications table...');
        await client.query('ALTER TABLE applications ADD COLUMN cover_letter TEXT');
        console.log('cover_letter column added successfully');
      }

      console.log('✅ Database initialized successfully');
      client.release();
      return;
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        console.error('❌ All database connection attempts failed. Please check your PostgreSQL setup.');
        throw error;
      }
      console.log(`⏳ Retrying in ${retryDelay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

// Application operations
async function createApplication(application) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO applications (workflow_id, company, role, job_description, resume, deadline, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      application.workflowId,
      application.company,
      application.role,
      application.jobDescription,
      application.resume,
      application.deadline,
      application.status
    ]);
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function getAllApplications() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM applications ORDER BY created_at DESC');
    return result.rows;
  } finally {
    client.release();
  }
}

async function getArchivedApplications() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM applications WHERE archived = true ORDER BY created_at DESC');
    return result.rows;
  } finally {
    client.release();
  }
}

async function getApplicationById(workflowId) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM applications WHERE workflow_id = $1', [workflowId]);
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function updateApplicationStatus(workflowId, status) {
  const client = await pool.connect();
  try {
    const archived = status === 'Archived';
    const result = await client.query(`
      UPDATE applications 
      SET status = $1, archived = $2, updated_at = CURRENT_TIMESTAMP
      WHERE workflow_id = $3
      RETURNING *
    `, [status, archived, workflowId]);
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function updateCoverLetter(workflowId, coverLetter) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      UPDATE applications 
      SET cover_letter = $1, updated_at = CURRENT_TIMESTAMP
      WHERE workflow_id = $2
      RETURNING *
    `, [coverLetter, workflowId]);
    return result.rows[0];
  } finally {
    client.release();
  }
}

module.exports = {
  initializeDatabase,
  createApplication,
  getAllApplications,
  getArchivedApplications,
  getApplicationById,
  updateApplicationStatus,
  updateCoverLetter,
  pool
};
