const { Pool } = require('pg');
const config = require('../config');
const queries = require('./queries');
const { database: dbLogger } = require('../utils/logger');

// Create connection pool
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
});

// Helper function to execute queries with logging
const executeQuery = async (queryId, params = [], operation = 'query') => {
  const client = await pool.connect();
  try {
    const query = queries[queryId];
    if (!query) {
      throw new Error(`Query with ID '${queryId}' not found`);
    }

    dbLogger.debug(`Executing query: ${queryId}`, { 
      operation, 
      params: params.length > 0 ? params : undefined 
    });

    const result = await client.query(query, params);
    
    dbLogger.debug(`Query completed: ${queryId}`, { 
      operation, 
      rowCount: result.rowCount 
    });

    return result;
  } catch (error) {
    dbLogger.error(`Query failed: ${queryId}`, { 
      operation, 
      error: error.message,
      params: params.length > 0 ? params : undefined 
    });
    throw error;
  } finally {
    client.release();
  }
};

// Database operations using query IDs
const dbOperations = {
  // Initialize database schema
  async initializeDatabase() {
    const maxRetries = 5;
    const retryDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        dbLogger.info(`Attempting to connect to database`, { attempt, maxRetries });
        
        // Create table
        await executeQuery('CREATE_APPLICATIONS_TABLE');
        
        // Check if cover_letter column exists
        const columnCheck = await executeQuery('CHECK_COVER_LETTER_COLUMN');
        
        if (columnCheck.rows.length === 0) {
          dbLogger.info('Adding cover_letter column to existing applications table');
          await executeQuery('ADD_COVER_LETTER_COLUMN');
          dbLogger.info('cover_letter column added successfully');
        }

        dbLogger.info('Database initialized successfully');
        return;
      } catch (error) {
        dbLogger.error(`Database connection attempt failed`, { 
          attempt, 
          maxRetries, 
          error: error.message 
        });
        
        if (attempt === maxRetries) {
          dbLogger.error('All database connection attempts failed. Please check your PostgreSQL setup.', { maxRetries });
          throw error;
        }
        
        dbLogger.info(`Retrying database connection`, { delaySeconds: retryDelay / 1000 });
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  },

  // Application CRUD operations
  async createApplication(application) {
    const result = await executeQuery('CREATE_APPLICATION', [
      application.workflowId,
      application.company,
      application.role,
      application.jobDescription,
      application.resume,
      application.deadline,
      application.status,
    ], 'create');
    return result.rows[0];
  },

  async getAllApplications() {
    const result = await executeQuery('GET_ALL_APPLICATIONS', [], 'read');
    return result.rows;
  },

  async getApplicationById(workflowId) {
    const result = await executeQuery('GET_APPLICATION_BY_ID', [workflowId], 'read');
    return result.rows[0];
  },

  async updateApplicationStatus(workflowId, status) {
    const result = await executeQuery('UPDATE_APPLICATION_STATUS', [workflowId, status], 'update');
    return result.rows[0];
  },

  async updateCoverLetter(workflowId, coverLetter) {
    const result = await executeQuery('UPDATE_COVER_LETTER', [workflowId, coverLetter], 'update');
    return result.rows[0];
  },

  async getArchivedApplications() {
    const result = await executeQuery('GET_ARCHIVED_APPLICATIONS', [], 'read');
    return result.rows;
  },

  async archiveApplication(workflowId) {
    const result = await executeQuery('ARCHIVE_APPLICATION', [workflowId], 'update');
    return result.rows[0];
  },

  async unarchiveApplication(workflowId) {
    const result = await executeQuery('UNARCHIVE_APPLICATION', [workflowId], 'update');
    return result.rows[0];
  },

  async deleteApplication(workflowId) {
    const result = await executeQuery('DELETE_APPLICATION', [workflowId], 'delete');
    return result.rows[0];
  },

  // Search and filtering operations
  async searchApplications(searchTerm, archived = false) {
    const result = await executeQuery('SEARCH_APPLICATIONS', [`%${searchTerm}%`, archived], 'search');
    return result.rows;
  },

  async getApplicationsByStatus(status, archived = false) {
    const result = await executeQuery('GET_APPLICATIONS_BY_STATUS', [status, archived], 'read');
    return result.rows;
  },

  async getApplicationsByCompany(company, archived = false) {
    const result = await executeQuery('GET_APPLICATIONS_BY_COMPANY', [`%${company}%`, archived], 'read');
    return result.rows;
  },

  // Statistics and analytics operations
  async getApplicationStats() {
    const result = await executeQuery('GET_APPLICATION_STATS', [], 'read');
    return result.rows[0];
  },

  async getApplicationsByMonth(startDate) {
    const result = await executeQuery('GET_APPLICATIONS_BY_MONTH', [startDate], 'read');
    return result.rows;
  },

  // Deadline and reminder operations
  async getUpcomingDeadlines() {
    const result = await executeQuery('GET_UPCOMING_DEADLINES', [], 'read');
    return result.rows;
  },

  async getOverdueApplications() {
    const result = await executeQuery('GET_OVERDUE_APPLICATIONS', [], 'read');
    return result.rows;
  },

  // Data cleanup operations
  async getOldArchivedApplications() {
    const result = await executeQuery('GET_OLD_ARCHIVED_APPLICATIONS', [], 'read');
    return result.rows;
  },

  async cleanupOldApplications() {
    const result = await executeQuery('CLEANUP_OLD_LOGS', [], 'delete');
    return result.rowCount;
  },

  // Export operations
  async exportAllApplications() {
    const result = await executeQuery('EXPORT_ALL_APPLICATIONS', [], 'read');
    return result.rows;
  },

  // Health check
  async healthCheck() {
    const result = await executeQuery('HEALTH_CHECK', [], 'health');
    return result.rows[0];
  },

  // Connection management
  async close() {
    await pool.end();
    dbLogger.info('Database connection pool closed');
  }
};

module.exports = dbOperations;
