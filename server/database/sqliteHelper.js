const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { database: dbLogger } = require('../utils/logger');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database file path
const dbPath = path.join(dataDir, 'applications.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    dbLogger.error('Error opening SQLite database', { error: err.message });
  } else {
    dbLogger.info('Connected to SQLite database', { path: dbPath });
  }
});

// Helper function to execute queries with logging
const executeQuery = (query, params = [], operation = 'query') => {
  return new Promise((resolve, reject) => {
    dbLogger.debug(`Executing SQLite query`, { 
      operation, 
      params: params.length > 0 ? params : undefined 
    });

    db.run(query, params, function(err) {
      if (err) {
        dbLogger.error(`SQLite query failed`, { 
          operation, 
          error: err.message,
          params: params.length > 0 ? params : undefined 
        });
        reject(err);
      } else {
        dbLogger.debug(`SQLite query completed`, { 
          operation, 
          changes: this.changes,
          lastID: this.lastID
        });
        resolve({ changes: this.changes, lastID: this.lastID });
      }
    });
  });
};

// Helper function to execute SELECT queries
const executeSelect = (query, params = [], operation = 'select') => {
  return new Promise((resolve, reject) => {
    dbLogger.debug(`Executing SQLite SELECT`, { 
      operation, 
      params: params.length > 0 ? params : undefined 
    });

    db.all(query, params, (err, rows) => {
      if (err) {
        dbLogger.error(`SQLite SELECT failed`, { 
          operation, 
          error: err.message,
          params: params.length > 0 ? params : undefined 
        });
        reject(err);
      } else {
        dbLogger.debug(`SQLite SELECT completed`, { 
          operation, 
          rowCount: rows.length 
        });
        resolve(rows);
      }
    });
  });
};

// SQLite database operations
const sqliteOperations = {
  // Initialize database schema
  async initializeDatabase() {
    try {
      dbLogger.info('Initializing SQLite database schema');
      
      // Create applications table
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS applications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workflow_id TEXT UNIQUE NOT NULL,
          company TEXT NOT NULL,
          role TEXT NOT NULL,
          job_description TEXT,
          resume TEXT,
          deadline TEXT,
          status TEXT DEFAULT 'Applied',
          archived INTEGER DEFAULT 0,
          cover_letter TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `, [], 'create_table');

      dbLogger.info('SQLite database initialized successfully');
    } catch (error) {
      dbLogger.error('Failed to initialize SQLite database', { error: error.message });
      throw error;
    }
  },

  // Application CRUD operations
  async createApplication(application) {
    const result = await executeQuery(`
      INSERT INTO applications (workflow_id, company, role, job_description, resume, deadline, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      application.workflowId,
      application.company,
      application.role,
      application.jobDescription,
      application.resume,
      application.deadline,
      application.status,
    ], 'create');
    
    return { id: result.lastID, ...application };
  },

  async getAllApplications() {
    return await executeSelect(`
      SELECT * FROM applications 
      ORDER BY created_at DESC
    `, [], 'read');
  },

  async getApplicationById(workflowId) {
    const rows = await executeSelect(`
      SELECT * FROM applications 
      WHERE workflow_id = ?
    `, [workflowId], 'read');
    return rows[0];
  },

  async updateApplicationStatus(workflowId, status) {
    await executeQuery(`
      UPDATE applications 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE workflow_id = ?
    `, [status, workflowId], 'update');
    
    return this.getApplicationById(workflowId);
  },

  async updateCoverLetter(workflowId, coverLetter) {
    await executeQuery(`
      UPDATE applications 
      SET cover_letter = ?, updated_at = CURRENT_TIMESTAMP
      WHERE workflow_id = ?
    `, [coverLetter, workflowId], 'update');
    
    return this.getApplicationById(workflowId);
  },

  async getArchivedApplications() {
    return await executeSelect(`
      SELECT * FROM applications 
      WHERE archived = 1 
      ORDER BY created_at DESC
    `, [], 'read');
  },

  async archiveApplication(workflowId) {
    await executeQuery(`
      UPDATE applications 
      SET archived = 1, updated_at = CURRENT_TIMESTAMP
      WHERE workflow_id = ?
    `, [workflowId], 'update');
    
    return this.getApplicationById(workflowId);
  },

  async unarchiveApplication(workflowId) {
    await executeQuery(`
      UPDATE applications 
      SET archived = 0, updated_at = CURRENT_TIMESTAMP
      WHERE workflow_id = ?
    `, [workflowId], 'update');
    
    return this.getApplicationById(workflowId);
  },

  async deleteApplication(workflowId) {
    await executeQuery(`
      DELETE FROM applications 
      WHERE workflow_id = ?
    `, [workflowId], 'delete');
  },

  // Search and filtering operations
  async searchApplications(searchTerm, archived = false) {
    return await executeSelect(`
      SELECT * FROM applications 
      WHERE 
        (company LIKE ? OR role LIKE ? OR job_description LIKE ?)
        AND archived = ?
      ORDER BY created_at DESC
    `, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, archived ? 1 : 0], 'search');
  },

  async getApplicationsByStatus(status, archived = false) {
    return await executeSelect(`
      SELECT * FROM applications 
      WHERE status = ? AND archived = ?
      ORDER BY created_at DESC
    `, [status, archived ? 1 : 0], 'read');
  },

  async getApplicationsByCompany(company, archived = false) {
    return await executeSelect(`
      SELECT * FROM applications 
      WHERE company LIKE ? AND archived = ?
      ORDER BY created_at DESC
    `, [`%${company}%`, archived ? 1 : 0], 'read');
  },

  // Statistics and analytics operations
  async getApplicationStats() {
    const rows = await executeSelect(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN archived = 0 THEN 1 END) as active_applications,
        COUNT(CASE WHEN archived = 1 THEN 1 END) as archived_applications,
        COUNT(CASE WHEN status = 'Applied' THEN 1 END) as applied_count,
        COUNT(CASE WHEN status = 'Interview' THEN 1 END) as interview_count,
        COUNT(CASE WHEN status = 'Offer' THEN 1 END) as offer_count,
        COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN status = 'Withdrawn' THEN 1 END) as withdrawn_count
      FROM applications
    `, [], 'read');
    return rows[0];
  },

  async getApplicationsByMonth(startDate) {
    return await executeSelect(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM applications 
      WHERE created_at >= ?
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `, [startDate], 'read');
  },

  // Deadline and reminder operations
  async getUpcomingDeadlines() {
    return await executeSelect(`
      SELECT * FROM applications 
      WHERE 
        deadline IS NOT NULL 
        AND deadline >= datetime('now')
        AND deadline <= datetime('now', '+7 days')
        AND archived = 0
      ORDER BY deadline ASC
    `, [], 'read');
  },

  async getOverdueApplications() {
    return await executeSelect(`
      SELECT * FROM applications 
      WHERE 
        deadline IS NOT NULL 
        AND deadline < datetime('now')
        AND status = 'Applied'
        AND archived = 0
      ORDER BY deadline ASC
    `, [], 'read');
  },

  // Data cleanup operations
  async getOldArchivedApplications() {
    return await executeSelect(`
      SELECT * FROM applications 
      WHERE 
        archived = 1 
        AND updated_at < datetime('now', '-1 year')
      ORDER BY updated_at ASC
    `, [], 'read');
  },

  async cleanupOldApplications() {
    const result = await executeQuery(`
      DELETE FROM applications 
      WHERE 
        archived = 1 
        AND updated_at < datetime('now', '-2 years')
    `, [], 'delete');
    return result.changes;
  },

  // Export operations
  async exportAllApplications() {
    return await executeSelect(`
      SELECT 
        workflow_id,
        company,
        role,
        job_description,
        resume,
        deadline,
        status,
        archived,
        cover_letter,
        created_at,
        updated_at
      FROM applications 
      ORDER BY created_at DESC
    `, [], 'read');
  },

  // Health check
  async healthCheck() {
    const rows = await executeSelect('SELECT 1 as health_check', [], 'health');
    return rows[0];
  },

  // Connection management
  async close() {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          dbLogger.error('Error closing SQLite database', { error: err.message });
          reject(err);
        } else {
          dbLogger.info('SQLite database connection closed');
          resolve();
        }
      });
    });
  }
};

module.exports = sqliteOperations;
