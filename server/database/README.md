# Database Structure

This directory contains the centralized database management system for the application tracker.

## Overview

The database system has been refactored to use a centralized query management approach with the following benefits:

- **Maintainability**: All SQL queries are stored in one place
- **Consistency**: Standardized query execution with logging
- **Security**: Automatic parameter sanitization and logging
- **Performance**: Connection pooling and query optimization
- **Debugging**: Detailed logging of all database operations

## File Structure

```
database/
├── README.md           # This documentation
├── queries.js          # Centralized SQL queries
└── dbHelper.js         # Database operations and connection management
```

## Query Management

### queries.js

Contains all SQL queries organized by functionality:

- **Table Management**: CREATE, ALTER, DROP operations
- **CRUD Operations**: Create, Read, Update, Delete applications
- **Search & Filtering**: Search by company, role, status, etc.
- **Statistics**: Analytics and reporting queries
- **Maintenance**: Cleanup and data management queries

### Query Naming Convention

Queries are named using UPPER_SNAKE_CASE with descriptive names:

- `CREATE_APPLICATIONS_TABLE`
- `GET_ALL_APPLICATIONS`
- `UPDATE_APPLICATION_STATUS`
- `SEARCH_APPLICATIONS`
- `GET_APPLICATION_STATS`

## Database Operations

### dbHelper.js

Provides a clean interface for all database operations:

```javascript
const db = require('../database');

// CRUD Operations
await db.createApplication(applicationData);
await db.getAllApplications();
await db.getApplicationById(workflowId);
await db.updateApplicationStatus(workflowId, status);
await db.updateCoverLetter(workflowId, coverLetter);

// Search and Filtering
await db.searchApplications(searchTerm, archived);
await db.getApplicationsByStatus(status, archived);
await db.getApplicationsByCompany(company, archived);

// Statistics
await db.getApplicationStats();
await db.getApplicationsByMonth(startDate);

// Maintenance
await db.getUpcomingDeadlines();
await db.getOverdueApplications();
await db.cleanupOldApplications();
```

## Logging

All database operations are automatically logged with:

- **Query ID**: Which query is being executed
- **Operation Type**: create, read, update, delete, search, etc.
- **Parameters**: Sanitized parameter values
- **Performance**: Query execution time
- **Errors**: Detailed error information with stack traces

### Log Levels

- **DEBUG**: Query execution details
- **INFO**: Successful operations
- **WARN**: Non-critical issues
- **ERROR**: Failed operations

## Security Features

### Parameter Sanitization

All user inputs are automatically sanitized to prevent SQL injection:

```javascript
// Automatic parameter binding
await db.getApplicationById(workflowId); // Uses $1 parameter binding
```

### Sensitive Data Redaction

Sensitive information is automatically redacted from logs:

- Database passwords
- API keys
- Authentication tokens
- Personal information

## Connection Management

### Connection Pooling

The system uses PostgreSQL connection pooling for optimal performance:

- **Max Connections**: 20 concurrent connections
- **Connection Timeout**: 10 seconds
- **Idle Timeout**: 30 seconds
- **Automatic Cleanup**: Connections are properly released

### Retry Logic

Database connections include automatic retry logic:

- **Max Retries**: 5 attempts
- **Retry Delay**: 2 seconds between attempts
- **Exponential Backoff**: Increasing delays for subsequent retries

## Adding New Queries

To add a new query:

1. **Add to queries.js**:
```javascript
const queries = {
  // ... existing queries ...
  
  NEW_QUERY_NAME: `
    SELECT * FROM applications 
    WHERE some_condition = $1
  `,
};
```

2. **Add to dbHelper.js**:
```javascript
async newOperation(param1) {
  const result = await executeQuery('NEW_QUERY_NAME', [param1], 'operation_type');
  return result.rows;
}
```

3. **Export from database.js**:
```javascript
module.exports = {
  // ... existing exports ...
  newOperation: dbHelper.newOperation,
};
```

## Best Practices

### Query Design

- Use parameterized queries to prevent SQL injection
- Include appropriate indexes for performance
- Use transactions for multi-step operations
- Add comments to complex queries

### Error Handling

- Always use try-catch blocks
- Log errors with context
- Provide meaningful error messages
- Handle connection failures gracefully

### Performance

- Use appropriate WHERE clauses
- Limit result sets when possible
- Use indexes on frequently queried columns
- Monitor query performance through logs

## Migration Guide

If you're updating from the old database.js:

1. **Update imports**: Use the new database module
2. **Update function calls**: Use the new function names
3. **Add error handling**: Leverage the new logging system
4. **Test thoroughly**: Verify all operations work correctly

## Monitoring

Monitor database performance through:

- **Application logs**: Check for slow queries
- **Database logs**: Monitor PostgreSQL performance
- **Connection pool**: Watch for connection issues
- **Error rates**: Track failed operations

## Troubleshooting

### Common Issues

1. **Connection Timeout**: Check database server status
2. **Query Errors**: Verify query syntax in queries.js
3. **Performance Issues**: Check query execution plans
4. **Memory Leaks**: Ensure connections are properly released

### Debug Mode

Enable debug logging to see detailed query information:

```javascript
// Set environment variable
LOG_LEVEL=debug
```

This will log all query executions with parameters and timing information.
