const validateApplication = (req, res, next) => {
  const { company, role, jobDescription, resume } = req.body;

  const errors = [];

  if (!company || typeof company !== 'string' || company.trim().length === 0) {
    errors.push('Company name is required and must be a non-empty string');
  }

  if (!role || typeof role !== 'string' || role.trim().length === 0) {
    errors.push('Role is required and must be a non-empty string');
  }

  if (
    !jobDescription ||
    typeof jobDescription !== 'string' ||
    jobDescription.trim().length === 0
  ) {
    errors.push('Job description is required and must be a non-empty string');
  }

  if (!resume || typeof resume !== 'string' || resume.trim().length === 0) {
    errors.push('Resume is required and must be a non-empty string');
  }

  // Validate deadline if provided
  if (req.body.deadline) {
    const deadline = new Date(req.body.deadline);
    if (isNaN(deadline.getTime())) {
      errors.push('Deadline must be a valid date');
    } else if (deadline < new Date()) {
      errors.push('Deadline cannot be in the past');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details: errors,
      },
    });
  }

  // Sanitize inputs
  req.body.company = company.trim();
  req.body.role = role.trim();
  req.body.jobDescription = jobDescription.trim();
  req.body.resume = resume.trim();

  next();
};

const validateStatusUpdate = (req, res, next) => {
  const { status } = req.body;
  const validStatuses = [
    'Applied',
    'Interview',
    'Offer',
    'Rejected',
    'Archived',
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      error: {
        message: 'Invalid status',
        details: [`Status must be one of: ${validStatuses.join(', ')}`],
      },
    });
  }

  next();
};

module.exports = {
  validateApplication,
  validateStatusUpdate,
};
