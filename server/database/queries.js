// SQL Queries for the application tracker
// Each query has a unique ID for easy reference and maintenance

const queries = {
  // Table creation and schema management
  CREATE_APPLICATIONS_TABLE: `
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
  `,

  CHECK_COVER_LETTER_COLUMN: `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'cover_letter'
  `,

  ADD_COVER_LETTER_COLUMN: `
    ALTER TABLE applications ADD COLUMN cover_letter TEXT
  `,

  // Application CRUD operations
  CREATE_APPLICATION: `
    INSERT INTO applications (workflow_id, company, role, job_description, resume, deadline, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `,

  GET_ALL_APPLICATIONS: `
    SELECT * FROM applications 
    ORDER BY created_at DESC
  `,

  GET_APPLICATION_BY_ID: `
    SELECT * FROM applications 
    WHERE workflow_id = $1
  `,

  UPDATE_APPLICATION_STATUS: `
    UPDATE applications 
    SET status = $2, updated_at = CURRENT_TIMESTAMP
    WHERE workflow_id = $1
    RETURNING *
  `,

  UPDATE_COVER_LETTER: `
    UPDATE applications 
    SET cover_letter = $2, updated_at = CURRENT_TIMESTAMP
    WHERE workflow_id = $1
    RETURNING *
  `,

  GET_ARCHIVED_APPLICATIONS: `
    SELECT * FROM applications 
    WHERE archived = TRUE 
    ORDER BY created_at DESC
  `,

  ARCHIVE_APPLICATION: `
    UPDATE applications 
    SET archived = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE workflow_id = $1
    RETURNING *
  `,

  UNARCHIVE_APPLICATION: `
    UPDATE applications 
    SET archived = FALSE, updated_at = CURRENT_TIMESTAMP
    WHERE workflow_id = $1
    RETURNING *
  `,

  DELETE_APPLICATION: `
    DELETE FROM applications 
    WHERE workflow_id = $1
    RETURNING *
  `,

  // Search and filtering queries
  SEARCH_APPLICATIONS: `
    SELECT * FROM applications 
    WHERE 
      (company ILIKE $1 OR role ILIKE $1 OR job_description ILIKE $1)
      AND archived = $2
    ORDER BY created_at DESC
  `,

  GET_APPLICATIONS_BY_STATUS: `
    SELECT * FROM applications 
    WHERE status = $1 AND archived = $2
    ORDER BY created_at DESC
  `,

  GET_APPLICATIONS_BY_COMPANY: `
    SELECT * FROM applications 
    WHERE company ILIKE $1 AND archived = $2
    ORDER BY created_at DESC
  `,

  // Statistics and analytics queries
  GET_APPLICATION_STATS: `
    SELECT 
      COUNT(*) as total_applications,
      COUNT(CASE WHEN archived = FALSE THEN 1 END) as active_applications,
      COUNT(CASE WHEN archived = TRUE THEN 1 END) as archived_applications,
      COUNT(CASE WHEN status = 'Applied' THEN 1 END) as applied_count,
      COUNT(CASE WHEN status = 'Interview' THEN 1 END) as interview_count,
      COUNT(CASE WHEN status = 'Offer' THEN 1 END) as offer_count,
      COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_count,
      COUNT(CASE WHEN status = 'Withdrawn' THEN 1 END) as withdrawn_count
    FROM applications
  `,

  GET_APPLICATIONS_BY_MONTH: `
    SELECT 
      DATE_TRUNC('month', created_at) as month,
      COUNT(*) as count
    FROM applications 
    WHERE created_at >= $1
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month DESC
  `,

  // Deadline and reminder queries
  GET_UPCOMING_DEADLINES: `
    SELECT * FROM applications 
    WHERE 
      deadline IS NOT NULL 
      AND deadline >= CURRENT_TIMESTAMP 
      AND deadline <= CURRENT_TIMESTAMP + INTERVAL '7 days'
      AND archived = FALSE
    ORDER BY deadline ASC
  `,

  GET_OVERDUE_APPLICATIONS: `
    SELECT * FROM applications 
    WHERE 
      deadline IS NOT NULL 
      AND deadline < CURRENT_TIMESTAMP 
      AND status = 'Applied'
      AND archived = FALSE
    ORDER BY deadline ASC
  `,

  // Data cleanup and maintenance queries
  GET_OLD_ARCHIVED_APPLICATIONS: `
    SELECT * FROM applications 
    WHERE 
      archived = TRUE 
      AND updated_at < CURRENT_TIMESTAMP - INTERVAL '1 year'
    ORDER BY updated_at ASC
  `,

  CLEANUP_OLD_LOGS: `
    DELETE FROM applications 
    WHERE 
      archived = TRUE 
      AND updated_at < CURRENT_TIMESTAMP - INTERVAL '2 years'
  `,

  // Backup and export queries
  EXPORT_ALL_APPLICATIONS: `
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
  `,

  // Health check query
  HEALTH_CHECK: `
    SELECT 1 as health_check
  `
};

module.exports = queries;
