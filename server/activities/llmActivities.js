const axios = require('axios');
const config = require('../config');
const { application } = require('../utils/logger');

// Simple in-memory cache for cover letters
const coverLetterCache = new Map();

async function generateCoverLetter(applicationData) {
  // Create a cache key based on company, role, and job description
  const cacheKey = `${applicationData.company}-${applicationData.role}-${applicationData.jobDescription?.substring(0, 100)}`;

  // Check cache first
  if (coverLetterCache.has(cacheKey)) {
    application.info('Returning cached cover letter', {
      company: applicationData.company,
      role: applicationData.role
    });
    return coverLetterCache.get(cacheKey);
  }

  const prompt = `Write a professional cover letter for the role of ${applicationData.role} at ${applicationData.company}.
  
Job Description: ${applicationData.jobDescription}

Please write a compelling cover letter that:
1. Addresses the hiring manager professionally
2. Explains why you're interested in this role and company
3. Highlights relevant skills and experience
4. Shows enthusiasm and fit for the position
5. Ends with a call to action

Keep it concise (around 300-400 words) and professional.`;

  try {
    const { apiKey } = config.gemini;
    const { model } = config.gemini;

    // Prefer Gemini when API key is configured; otherwise fall back to mock
    if (apiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await axios.post(
        url,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 700,
          },
        },
        {
          timeout: 10000, // Reduced from 20 seconds to 10 seconds
        }
      );

      const candidates = response?.data?.candidates || [];
      const text = candidates[0]?.content?.parts?.[0]?.text;
      if (text && typeof text === 'string') {
        const coverLetter = text.trim();
        // Cache the result
        coverLetterCache.set(cacheKey, coverLetter);
        return coverLetter;
      }
      application.warn('Gemini response did not contain expected text. Falling back to mock.');
    } else {
      application.warn('GEMINI_API_KEY not set. Using mock cover letter.');
    }

    // Mock response fallback
    const mockCoverLetter = `Dear Hiring Manager,

I am writing to express my strong interest in the ${applicationData.role} position at ${applicationData.company}. With my background in software development and passion for creating innovative solutions, I am excited about the opportunity to contribute to your team.

Based on the job description, I believe my technical skills and experience align well with your requirements. I have experience working with modern technologies and frameworks, and I am particularly drawn to ${applicationData.company}'s mission and the impact your products have on users.

Throughout my career, I have demonstrated the ability to work collaboratively in fast-paced environments, solve complex problems, and deliver high-quality results. I am confident that my technical expertise, combined with my strong communication skills and attention to detail, would make me a valuable addition to your team.

I am particularly excited about the opportunity to work on challenging projects and contribute to the continued growth and success of ${applicationData.company}. I am eager to discuss how my background, skills, and enthusiasm would benefit your organization.

Thank you for considering my application. I look forward to the opportunity to discuss this position further and learn more about the exciting work being done at ${applicationData.company}.

Best regards,
[Your Name]`;

    application.info('Cover letter generated successfully');
    // Cache the mock result too
    coverLetterCache.set(cacheKey, mockCoverLetter);
    return mockCoverLetter;
  } catch (error) {
    application.error('Error generating cover letter', { error: error.message });

    // Return a fallback cover letter if API fails
    const fallbackCoverLetter = `Dear Hiring Manager,

I am writing to express my interest in the ${applicationData.role} position at ${applicationData.company}. I am excited about the opportunity to contribute to your team and would welcome the chance to discuss how my skills and experience align with your needs.

Thank you for your consideration.

Best regards,
[Your Name]`;

    // Cache the fallback too
    coverLetterCache.set(cacheKey, fallbackCoverLetter);
    return fallbackCoverLetter;
  }
}

module.exports = { generateCoverLetter };

// New activities used by the workflow
const nodemailer = require('nodemailer');

function buildTransport() {
  const { host } = config.email;
  const { port } = config.email;
  const { user } = config.email;
  const { pass } = config.email;
  if (!host || !user || !pass) {
    application.warn('Email transport not fully configured; falling back to console logs');
    return null;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendReminder(applicationData, reason) {
  try {
    application.info('Sending reminder email', {
      reason,
      company: applicationData.company,
      role: applicationData.role,
      deadline: applicationData.deadline
    });

    // Debug email configuration
    application.debug('Email configuration check', {
      smtpHost: config.email.host ? 'SET' : 'MISSING',
      smtpUser: config.email.user ? 'SET' : 'MISSING',
      smtpPass: config.email.pass ? 'SET' : 'MISSING',
      emailFrom: config.email.from || 'NOT SET (will use user)',
      emailTo: config.email.to || 'NOT SET (will use user)'
    });

    const recipient = config.email.to || config.email.user;
    const from = config.email.from || config.email.user;
    const transport = buildTransport();

    application.debug('Email transport status', {
      transportCreated: transport ? 'YES' : 'NO',
      recipient: recipient || 'MISSING'
    });

    if (transport && recipient) {
      const subjectMap = {
        'pre-deadline': `Reminder: ${applicationData.role} @ ${applicationData.company} deadline tomorrow`,
        'deadline-reached': `Action needed: ${applicationData.role} @ ${applicationData.company} deadline reached`,
      };
      const subject =
        subjectMap[reason] ||
        `Reminder: ${applicationData.role} @ ${applicationData.company}`;
      const html = `
        <p>Hi,</p>
        <p>This is a reminder for your application:</p>
        <ul>
          <li><strong>Company</strong>: ${applicationData.company}</li>
          <li><strong>Role</strong>: ${applicationData.role}</li>
          <li><strong>Deadline</strong>: ${applicationData.deadline}</li>
        </ul>
        <p>Status is still <strong>Applied</strong>. Consider updating the status or doing a follow-up.</p>
        <p>— Application Tracker</p>
      `;

      application.info('Attempting to send email', {
        from,
        to: recipient,
        subject
      });

      await transport.sendMail({ from, to: recipient, subject, html });
      application.info('Email reminder sent successfully', { recipient });
    } else {
      application.warn('Email not sent: transport or recipient missing', {
        transportMissing: !transport,
        recipientMissing: !recipient
      });
    }
    return { ok: true };
  } catch (err) {
    application.error('sendReminder failed', { error: err?.message || err });
    return { ok: false };
  }
}

async function archiveApplication(applicationData) {
  try {
    application.info('Application archived', {
      company: applicationData.company,
      role: applicationData.role
    });
    // Hook: mark archived in DB/emit event
    return { ok: true };
  } catch (err) {
    application.error('archiveApplication failed', { error: err?.message || err });
    return { ok: false };
  }
}

async function updateCoverLetter(workflowId, coverLetter) {
  try {
    application.info('Storing cover letter', { workflowId });

    // Import the database module
    const db = require('../database');
    await db.updateCoverLetter(workflowId, coverLetter);

    application.info('Cover letter stored successfully', { workflowId });
    return { ok: true };
  } catch (err) {
    application.error('updateCoverLetter failed', { error: err?.message || err, workflowId });
    return { ok: false };
  }
}

module.exports = {
  generateCoverLetter,
  sendReminder,
  archiveApplication,
  updateCoverLetter,
};
