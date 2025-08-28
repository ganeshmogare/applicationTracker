// Main database module that automatically chooses between SQLite and PostgreSQL
const config = require('./config');
const { application } = require('./utils/logger');

let dbHelper;

// Dynamically load the appropriate database helper based on configuration
if (config.database.type === 'sqlite') {
  application.info('Using SQLite database for local development');
  dbHelper = require('./database/sqliteHelper');
} else {
  application.info('Using PostgreSQL database for production');
  dbHelper = require('./database/dbHelper');
}

// Export all database operations
module.exports = {
  // Initialize database
  initializeDatabase: dbHelper.initializeDatabase,
  
  // Application CRUD operations
  createApplication: dbHelper.createApplication,
  getAllApplications: dbHelper.getAllApplications,
  getApplicationById: dbHelper.getApplicationById,
  updateApplicationStatus: dbHelper.updateApplicationStatus,
  updateCoverLetter: dbHelper.updateCoverLetter,
  getArchivedApplications: dbHelper.getArchivedApplications,
  
  // Additional operations available through the helper
  archiveApplication: dbHelper.archiveApplication,
  unarchiveApplication: dbHelper.unarchiveApplication,
  deleteApplication: dbHelper.deleteApplication,
  
  // Search and filtering
  searchApplications: dbHelper.searchApplications,
  getApplicationsByStatus: dbHelper.getApplicationsByStatus,
  getApplicationsByCompany: dbHelper.getApplicationsByCompany,
  
  // Statistics and analytics
  getApplicationStats: dbHelper.getApplicationStats,
  getApplicationsByMonth: dbHelper.getApplicationsByMonth,
  
  // Deadline and reminder operations
  getUpcomingDeadlines: dbHelper.getUpcomingDeadlines,
  getOverdueApplications: dbHelper.getOverdueApplications,
  
  // Data cleanup
  getOldArchivedApplications: dbHelper.getOldArchivedApplications,
  cleanupOldApplications: dbHelper.cleanupOldApplications,
  
  // Export operations
  exportAllApplications: dbHelper.exportAllApplications,
  
  // Health check
  healthCheck: dbHelper.healthCheck,
  
  // Connection management
  close: dbHelper.close,
  
  // Database information
  getDatabaseInfo: () => ({
    type: config.database.type,
    isLocal: config.environment.isLocal,
    nodeEnv: config.environment.nodeEnv,
  }),
};
