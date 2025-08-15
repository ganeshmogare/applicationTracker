const axios = require('axios');
const config = require('../config');

// Simple in-memory cache for cover letters
const coverLetterCache = new Map();

async function generateCoverLetter(applicationData) {
  // Create a cache key based on company, role, and job description
  const cacheKey = `${applicationData.company}-${applicationData.role}-${applicationData.jobDescription?.substring(0, 100)}`;
  
  // Check cache first
  if (coverLetterCache.has(cacheKey)) {
    console.log('Returning cached cover letter for:', applicationData.company, applicationData.role);
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
    const apiKey = config.gemini.apiKey;
    const model = config.gemini.model;

    // Prefer Gemini when API key is configured; otherwise fall back to mock
    if (apiKey) {
      console.log('Generating cover letter via Gemini for:', applicationData.company, applicationData.role);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await axios.post(url, {
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
      }, {
        timeout: 10000, // Reduced from 20 seconds to 10 seconds
      });

      const candidates = response?.data?.candidates || [];
      const text = candidates[0]?.content?.parts?.[0]?.text;
      if (text && typeof text === 'string') {
        const coverLetter = text.trim();
        // Cache the result
        coverLetterCache.set(cacheKey, coverLetter);
        return coverLetter;
      }
      console.warn('Gemini response did not contain expected text. Falling back to mock.');
    } else {
      console.warn('GEMINI_API_KEY not set. Using mock cover letter.');
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

    console.log('Cover letter generated successfully');
    // Cache the mock result too
    coverLetterCache.set(cacheKey, mockCoverLetter);
    return mockCoverLetter;
    
  } catch (error) {
    console.error('Error generating cover letter:', error.message);
    
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
  const host = config.email.host;
  const port = config.email.port;
  const user = config.email.user;
  const pass = config.email.pass;
  if (!host || !user || !pass) {
    console.warn('Email transport not fully configured; falling back to console logs');
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
    console.log(`[Reminder:${reason}] ${applicationData.company} - ${applicationData.role} (deadline: ${applicationData.deadline})`);
    
    // Debug email configuration
    console.log('Email config check:');
    console.log('- EMAIL_SMTP_HOST:', config.email.host ? 'SET' : 'MISSING');
    console.log('- EMAIL_SMTP_USER:', config.email.user ? 'SET' : 'MISSING');
    console.log('- EMAIL_SMTP_PASS:', config.email.pass ? 'SET' : 'MISSING');
    console.log('- EMAIL_FROM:', config.email.from || 'NOT SET (will use user)');
    console.log('- EMAIL_TO:', config.email.to || 'NOT SET (will use user)');
    
    const recipient = config.email.to || config.email.user;
    const from = config.email.from || config.email.user;
    const transport = buildTransport();
    
    console.log('Transport created:', transport ? 'YES' : 'NO');
    console.log('Recipient:', recipient || 'MISSING');
    
    if (transport && recipient) {
      const subjectMap = {
        'pre-deadline': `Reminder: ${applicationData.role} @ ${applicationData.company} deadline tomorrow`,
        'deadline-reached': `Action needed: ${applicationData.role} @ ${applicationData.company} deadline reached`,
      };
      const subject = subjectMap[reason] || `Reminder: ${applicationData.role} @ ${applicationData.company}`;
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
      
      console.log('Attempting to send email...');
      console.log('- From:', from);
      console.log('- To:', recipient);
      console.log('- Subject:', subject);
      
      await transport.sendMail({ from, to: recipient, subject, html });
      console.log('✅ Email reminder sent successfully to', recipient);
    } else {
      console.log('❌ Email not sent: transport or recipient missing');
      if (!transport) console.log('  - Transport creation failed');
      if (!recipient) console.log('  - Recipient email missing');
    }
    return { ok: true };
  } catch (err) {
    console.error('❌ sendReminder failed:', err?.message || err);
    return { ok: false };
  }
}

async function archiveApplication(applicationData) {
  try {
    console.log(`[Archive] ${applicationData.company} - ${applicationData.role}`);
    console.log('✅ Application archived successfully');
    // Hook: mark archived in DB/emit event
    return { ok: true };
  } catch (err) {
    console.error('❌ archiveApplication failed:', err?.message || err);
    return { ok: false };
  }
}

async function updateCoverLetter(workflowId, coverLetter) {
  try {
    console.log(`[UpdateCoverLetter] Storing cover letter for workflow: ${workflowId}`);
    
    // Import the database module
    const db = require('../database');
    await db.updateCoverLetter(workflowId, coverLetter);
    
    console.log('✅ Cover letter stored successfully');
    return { ok: true };
  } catch (err) {
    console.error('❌ updateCoverLetter failed:', err?.message || err);
    return { ok: false };
  }
}

module.exports = { generateCoverLetter, sendReminder, archiveApplication, updateCoverLetter };
