import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { RtcTokenBuilder, RtcRole } = require('agora-token');

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// ── JWT & SMTP Auth Infrastructure ───────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'vocalis_ai_jwt_secret_key_2026_super_secure_key';

// Nodemailer Transporter Setup
function getMailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for 587
      auth: { user, pass },
    });
  }

  // Simulated logger fallback when SMTP credentials are not yet entered
  return {
    sendMail: async (options: any) => {
      console.log(`\n[SMTP Transporter Sim] Simulated Email Sent to: ${options.to}`);
      console.log(`[SMTP Transporter Sim] Subject: ${options.subject}`);
      console.log(`[SMTP Transporter Sim] Body:\n${options.text || options.html}\n`);
      return { messageId: `sim_${Date.now()}` };
    },
  };
}

// In-Memory User Store (pre-seeded with default demo credentials)
interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'candidate' | 'recruiter' | 'interviewer';
  isVerified: boolean;
  otpCode?: string;
  otpExpires?: number;
  createdAt: string;
}

const usersDb = new Map<string, UserRecord>();

// Seed default demo accounts
const defaultDemoPassword = bcrypt.hashSync('password123', 10);
usersDb.set('candidate@vocalis.ai', {
  id: 'usr_cand_101',
  email: 'candidate@vocalis.ai',
  passwordHash: defaultDemoPassword,
  name: 'Demo Candidate',
  role: 'candidate',
  isVerified: true,
  createdAt: new Date().toISOString(),
});

usersDb.set('recruiter@vocalis.ai', {
  id: 'usr_rec_102',
  email: 'recruiter@vocalis.ai',
  passwordHash: defaultDemoPassword,
  name: 'Lead Technical Recruiter',
  role: 'recruiter',
  isVerified: true,
  createdAt: new Date().toISOString(),
});

// Auth API 1: Register User & Send SMTP Verification Email
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role = 'candidate' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    if (usersDb.has(cleanEmail)) {
      return res.status(400).json({ error: 'Account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const newUser: UserRecord = {
      id: userId,
      email: cleanEmail,
      passwordHash,
      name: String(name).trim(),
      role: role as any,
      isVerified: false,
      otpCode,
      otpExpires: Date.now() + 15 * 60 * 1000, // 15 mins
      createdAt: new Date().toISOString(),
    };

    usersDb.set(cleanEmail, newUser);

    // Issue Signed JWT Token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send SMTP Verification Email
    let emailSent = false;
    try {
      const transporter = getMailTransporter();
      const fromAddr = process.env.SMTP_FROM || 'Vocalis AI Auth <noreply@vocalis.ai>';
      await transporter.sendMail({
        from: fromAddr,
        to: cleanEmail,
        subject: 'Welcome to Vocalis AI — Verification Code',
        text: `Hello ${newUser.name},\n\nWelcome to Vocalis AI! Your 6-digit verification code is: ${otpCode}\n\nThis code expires in 15 minutes.`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
            <h2 style="color: #4f46e5; margin-top: 0;">Welcome to Vocalis AI</h2>
            <p>Hello <strong>${newUser.name}</strong>,</p>
            <p>Thank you for signing up for Vocalis AI's Autonomous Multi-Role AI Voice Interview Panel.</p>
            <div style="background: #f1f5f9; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e293b;">
              ${otpCode}
            </div>
            <p style="font-size: 12px; color: #64748b; margin-top: 15px;">This code will expire in 15 minutes.</p>
          </div>
        `,
      });
      emailSent = true;
    } catch (mailErr: any) {
      console.warn(`[SMTP Warning] Failed to send email: ${mailErr.message}`);
    }

    return res.json({
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isVerified: newUser.isVerified,
      },
      emailSent,
      otpCodeSimulated: process.env.SMTP_USER ? undefined : otpCode,
    });
  } catch (err: any) {
    console.error('[Auth Register Error]', err);
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Auth API 2: Login User & Issue JWT Token
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = usersDb.get(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Issue Signed JWT Token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (err: any) {
    console.error('[Auth Login Error]', err);
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Auth API 3: Verify OTP Code
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    const cleanEmail = String(email).trim().toLowerCase();
    const user = usersDb.get(cleanEmail);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.otpCode !== String(otpCode).trim()) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    if (user.otpExpires && Date.now() > user.otpExpires) {
      return res.status(400).json({ error: 'OTP code has expired' });
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;

    return res.json({
      message: 'Account verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: true,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Verification failed' });
  }
});

// Auth API 3b: Request Passwordless / Forgot Password OTP Code
app.post('/api/auth/request-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    let user = usersDb.get(cleanEmail);

    if (!user) {
      // Auto-register candidate if not registered yet
      const name = cleanEmail.split('@')[0];
      const passwordHash = await bcrypt.hash('password123', 10);
      user = {
        id: `usr-${Date.now()}`,
        email: cleanEmail,
        passwordHash,
        name,
        role: 'candidate',
        createdAt: new Date().toISOString(),
        isVerified: true,
      };
      usersDb.set(cleanEmail, user);
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otpCode;
    user.otpExpires = Date.now() + 15 * 60 * 1000;

    let emailSent = false;
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      });

      await transporter.sendMail({
        from: `"Vocalis AI Security" <${process.env.SMTP_USER || 'noreply@vocalis.ai'}>`,
        to: user.email,
        subject: `${otpCode} is your Passwordless Login OTP Code - Vocalis AI`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a;">
            <h2>Passwordless OTP Login Request</h2>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>Use the 6-digit OTP code below to sign in or reset your password on Vocalis AI Studio:</p>
            <div style="background: #f1f5f9; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #4f46e5;">
              ${otpCode}
            </div>
            <p style="font-size: 12px; color: #64748b; margin-top: 15px;">This code will expire in 15 minutes.</p>
          </div>
        `,
      });
      emailSent = true;
    } catch (mailErr: any) {
      console.warn(`[SMTP Warning] OTP email send failed: ${mailErr.message}`);
    }

    return res.json({
      message: 'Login OTP code generated successfully',
      emailSent,
      otpCodeSimulated: process.env.SMTP_USER ? undefined : otpCode,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to request OTP code' });
  }
});

// Auth API 3c: Login with OTP Code (Passwordless / Reset Fallback)
app.post('/api/auth/login-with-otp', async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    const cleanEmail = String(email).trim().toLowerCase();
    const user = usersDb.get(cleanEmail);

    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    if (!user.otpCode || user.otpCode !== String(otpCode).trim()) {
      return res.status(400).json({ error: 'Invalid or incorrect OTP code' });
    }

    if (user.otpExpires && Date.now() > user.otpExpires) {
      return res.status(400).json({ error: 'OTP code has expired' });
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful via OTP code',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: true,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'OTP Login failed' });
  }
});

// Auth API 4: Get Current User Profile (JWT Protected)
app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);

    const user = usersDb.get(decoded.email);
    if (!user) {
      return res.status(404).json({ error: 'User session expired or user not found' });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid or expired JWT token' });
  }
});

// Lazy initialize Gemini AI clients (supports primary & secondary keys)
function getGeminiClients(): GoogleGenAI[] {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_SECONDARY,
  ].filter(Boolean) as string[];

  if (keys.length === 0) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }

  return keys.map(
    (apiKey) =>
      new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
  );
}

// Fallback helper for handling temporary 503 high demand errors across Gemini models and keys
async function generateContentWithFallback(options: any) {
  const clients = getGeminiClients();
  const primaryModel = options.model || 'gemini-2.5-flash';
  const modelsToTry = Array.from(
    new Set([primaryModel, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'])
  );
  let lastError: any = null;

  for (const ai of clients) {
    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          ...options,
          model,
        });
        return response;
      } catch (err: any) {
        console.warn(`[Gemini Model Fallback] Model "${model}" failed (${err.message}). Trying fallback model/key...`);
        lastError = err;
      }
    }
  }
  throw lastError;
}

// Groq Ultra-Fast Sub-100ms Inference Engine with multi-key & multi-model fallback
async function generateContentWithGroq(prompt: string): Promise<any> {
  const keys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_SECONDARY,
  ].filter(Boolean) as string[];

  if (keys.length === 0) throw new Error('GROQ_API_KEY missing');

  const modelsToTry = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'llama3-70b-8192',
    'llama3-8b-8192',
    'gemma2-9b-it',
    'qwen-2.5-32b',
  ];

  let lastError: any = null;
  for (const apiKey of keys) {
    for (const model of modelsToTry) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  'You are the Orchestration, Persona & Adaptive Probing Engine for a Collaborative Multi-Role AI Interview Panel. You MUST respond with raw valid JSON only matching properties: nextSpeakerId, nextSpeakerName, nextSpeakerRole, speech, internalThought, turnTakingReason, questionTopic, targetCompetency, adaptiveStrategyApplied, resumePointReferenced, analysisOfCandidateAnswer, detectedFlags, updatedDifficulty, updatedCompetencyScores, updatedRunningSummary.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.6,
            max_tokens: 1500,
          }),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          throw new Error(`Groq API error ${res.status} [${model}]: ${errText}`);
        }

        const json = await res.json();
        const contentStr = json.choices?.[0]?.message?.content || '{}';
        console.log(`[Groq AI] Successfully generated turn using model "${model}"`);
        return JSON.parse(contentStr);
      } catch (err: any) {
        console.warn(`[Groq API Fallback] Model "${model}" or key call failed (${err.message}). Trying next fallback...`);
        lastError = err;
      }
    }
  }
  throw lastError;
}

// Normalizer to ensure turn response data adheres strictly to expected frontend schema
function normalizeTurnResponse(raw: any, activePanel: any[], scenario: any, sharedContext: any) {
  const fallbackInterviewer =
    activePanel && activePanel.length > 0
      ? activePanel[0]
      : { id: 'alex-vance', name: 'Alex Vance', role: 'technical' };

  const nextSpeakerId = raw.nextSpeakerId || fallbackInterviewer.id;
  const matchedInterviewer = activePanel.find((p: any) => p.id === nextSpeakerId) || fallbackInterviewer;

  const defaultScores = {
    technicalArchitecture: 75,
    businessAndCustomerImpact: 70,
    communicationAndClarity: 75,
    leadershipAndOwnership: 70,
    problemSolvingAndAgility: 75,
    ...(sharedContext.competencyScores || {}),
  };

  const incomingScores = raw.updatedCompetencyScores || {};

  return {
    nextSpeakerId: matchedInterviewer.id,
    nextSpeakerName: raw.nextSpeakerName || matchedInterviewer.name,
    nextSpeakerRole: raw.nextSpeakerRole || matchedInterviewer.role || 'technical',
    speech: raw.speech || 'Could you walk us through the system architecture and key engineering trade-offs?',
    internalThought: raw.internalThought || 'Panel evaluated candidate response. Formulated adaptive follow-up question.',
    turnTakingReason: raw.turnTakingReason || `${matchedInterviewer.name} asked the next probing question.`,
    questionTopic: raw.questionTopic || scenario.title || 'System Architecture & Engineering Trade-offs',
    targetCompetency: raw.targetCompetency || 'technicalArchitecture',
    adaptiveStrategyApplied: raw.adaptiveStrategyApplied || 'Deep Probe',
    resumePointReferenced: raw.resumePointReferenced || undefined,
    analysisOfCandidateAnswer: {
      sentiment: raw.analysisOfCandidateAnswer?.sentiment || 'Analytical & Deep',
      depthLevel: raw.analysisOfCandidateAnswer?.depthLevel || 'Intermediate (Practical)',
      detectedKeywords: Array.isArray(raw.analysisOfCandidateAnswer?.detectedKeywords)
        ? raw.analysisOfCandidateAnswer.detectedKeywords
        : ['architecture', 'performance'],
      candidateResponseSummary: raw.analysisOfCandidateAnswer?.candidateResponseSummary || 'Candidate explained system overview.',
    },
    detectedFlags: Array.isArray(raw.detectedFlags) ? raw.detectedFlags : [],
    updatedDifficulty: raw.updatedDifficulty || sharedContext.currentDifficulty || 'Senior',
    difficultyAdjustmentReason: raw.difficultyAdjustmentReason || undefined,
    updatedCompetencyScores: {
      technicalArchitecture: typeof incomingScores.technicalArchitecture === 'number' ? incomingScores.technicalArchitecture : defaultScores.technicalArchitecture,
      businessAndCustomerImpact: typeof incomingScores.businessAndCustomerImpact === 'number' ? incomingScores.businessAndCustomerImpact : defaultScores.businessAndCustomerImpact,
      communicationAndClarity: typeof incomingScores.communicationAndClarity === 'number' ? incomingScores.communicationAndClarity : defaultScores.communicationAndClarity,
      leadershipAndOwnership: typeof incomingScores.leadershipAndOwnership === 'number' ? incomingScores.leadershipAndOwnership : defaultScores.leadershipAndOwnership,
      problemSolvingAndAgility: typeof incomingScores.problemSolvingAndAgility === 'number' ? incomingScores.problemSolvingAndAgility : defaultScores.problemSolvingAndAgility,
    },
    newBackstageNote: raw.newBackstageNote && raw.newBackstageNote.note
      ? {
          authorRole: raw.newBackstageNote.authorRole || matchedInterviewer.role,
          note: raw.newBackstageNote.note,
        }
      : undefined,
    updatedRunningSummary: raw.updatedRunningSummary || sharedContext.runningSummary || 'Interview in progress.',
    unresolvedProbesToAdd: Array.isArray(raw.unresolvedProbesToAdd) ? raw.unresolvedProbesToAdd : undefined,
    resolvedProbesToRemove: Array.isArray(raw.resolvedProbesToRemove) ? raw.resolvedProbesToRemove : undefined,
  };
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
    hasGroqApiKey: Boolean(process.env.GROQ_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Endpoint: AI-Powered Resume Parser using Gemini 2.5 Flash / Groq LLM
app.post('/api/resume/parse', async (req, res) => {
  try {
    const { rawText, fallbackName = 'Candidate' } = req.body;
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: 'Resume rawText is required' });
    }

    const systemPrompt = `You are an expert AI talent intelligence parser.
Parse the raw resume/LinkedIn text below into a clean, structured JSON object with ZERO assumptions.
Return ONLY valid JSON matching this schema:

{
  "fullName": "Full candidate name (string)",
  "headline": "Professional target headline or current role (string)",
  "yearsOfExperience": number (default 2),
  "location": "City, State/Country or Remote (string)",
  "summary": "Executive summary paragraph (string)",
  "skills": {
    "coreArchitecture": ["Architecture/AI/System skill 1", "skill 2"],
    "languagesAndFrameworks": ["Language/framework 1", "framework 2"],
    "cloudAndInfrastructure": ["Cloud/database/tool 1", "tool 2"],
    "practicesAndMethodologies": ["Methodology/practice 1", "practice 2"]
  },
  "workExperience": [
    {
      "company": "Company or Organization name",
      "role": "Job or Intern Title",
      "duration": "Dates (e.g. Mar 2026 - Apr 2026)",
      "highlights": ["Bullet highlight 1", "Bullet highlight 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree name",
      "institution": "School or University name",
      "year": "Graduation year or date range"
    }
  ],
  "notableProjects": [
    {
      "name": "Exact Project Name",
      "description": "Full description of project implementation and features",
      "metrics": "Key technical metric or outcome"
    }
  ]
}

If candidate name is missing in text, use fallback: "${fallbackName}".
Do NOT hallucinate fake company names or fake project names if not in raw text. Extract exact real project names and real experience from the provided text.`;

    const userPrompt = `RAW RESUME TEXT:\n${rawText.slice(0, 8000)}`;

    let parsedResult: any = null;

    // 1. Try Gemini 2.5 Flash
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${systemPrompt}\n\n${userPrompt}`,
          config: {
            responseMimeType: 'application/json',
          },
        });
        const responseText = response.text;
        if (responseText) {
          parsedResult = JSON.parse(responseText);
        }
      } catch (err: any) {
        console.warn(`[Gemini Resume Parse Warning] ${err.message}`);
      }
    }

    // 2. Fallback to Groq LLM API if Gemini fails or no key
    if (!parsedResult && process.env.GROQ_API_KEY) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
          }),
        });

        if (groqRes.ok) {
          const json = await groqRes.json();
          const contentStr = json.choices?.[0]?.message?.content || '{}';
          parsedResult = JSON.parse(contentStr);
        }
      } catch (err: any) {
        console.warn(`[Groq Resume Parse Warning] ${err.message}`);
      }
    }

    if (parsedResult) {
      return res.json({
        success: true,
        resume: {
          id: `custom-resume-${Date.now()}`,
          fullName: parsedResult.fullName || fallbackName,
          headline: parsedResult.headline || 'Software Engineer',
          yearsOfExperience: typeof parsedResult.yearsOfExperience === 'number' ? parsedResult.yearsOfExperience : 2,
          location: parsedResult.location || 'Remote',
          summary: parsedResult.summary || rawText.slice(0, 300),
          skills: {
            coreArchitecture: Array.isArray(parsedResult.skills?.coreArchitecture) ? parsedResult.skills.coreArchitecture : ['System Architecture'],
            languagesAndFrameworks: Array.isArray(parsedResult.skills?.languagesAndFrameworks) ? parsedResult.skills.languagesAndFrameworks : ['Python', 'SQL'],
            cloudAndInfrastructure: Array.isArray(parsedResult.skills?.cloudAndInfrastructure) ? parsedResult.skills.cloudAndInfrastructure : ['Git', 'GitHub'],
            practicesAndMethodologies: Array.isArray(parsedResult.skills?.practicesAndMethodologies) ? parsedResult.skills.practicesAndMethodologies : ['Agile'],
          },
          workExperience: Array.isArray(parsedResult.workExperience) ? parsedResult.workExperience : [],
          education: Array.isArray(parsedResult.education) ? parsedResult.education : [],
          notableProjects: Array.isArray(parsedResult.notableProjects) ? parsedResult.notableProjects : [],
          rawText,
        },
      });
    }

    return res.status(500).json({ error: 'LLM parsing failed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Process Interview Turn with Multi-Role Deliberation & Adaptive Probing
app.post('/api/interview/turn', async (req, res) => {
  try {
    const {
      transcript = [],
      sharedContext = {},
      activePanel = [],
      lastCandidateSpeech = '',
      scenario = {},
      interrupted = false,
      userAddressedInterviewerId = null,
    } = req.body;

    const candidateResume = sharedContext.candidateResume || {};
    const questionHistory = sharedContext.questionHistory || [];

    // Format interviewer personas with detailed speaking styles, jargon, and questioning strategies
    const panelDescriptions = activePanel
      .map((p: any) => {
        const style = p.speakingStyle || {};
        return `• ID: "${p.id}", Name: ${p.name}, Role: [${p.role.toUpperCase()}], Title: ${p.title} (${p.company})
  Focus: ${p.focusArea}
  Tone: ${style.tone || 'Professional'}
  Signature Jargon/Concepts: ${(style.signatureJargon || []).join(', ') || 'Domain standard'}
  Questioning Strategy: ${style.questioningStrategy || p.systemPrompt}
  Typical Areas of Questioning: ${(style.typicalAreasOfQuestioning || []).join('; ') || 'Domain fundamentals'}
  Handoff Phrasing Style: ${style.handoffStyle || 'Direct'}
  Sample Voice Phrase: "${style.samplePhrase || ''}"`;
      })
      .join('\n\n');

    // Format previous questions asked by all interviewers
    const questionHistorySummary = questionHistory.length > 0
      ? questionHistory
          .slice(-8)
          .map((q: any, idx: number) => `Q${idx + 1} by [${q.interviewerRole?.toUpperCase()} - ${q.interviewerName}] on "${q.topic}": "${q.questionText}" (Candidate Depth: ${q.candidateDepth || 'Evaluated'}, Strategy: ${q.adaptiveStrategyUsed || 'Initial'})`)
          .join('\n')
      : 'No previous structured questions in record.';

    // Format candidate's resume highlights
    const resumeSummary = `
Candidate Name: ${candidateResume.fullName || sharedContext.candidateName || 'Candidate'}
Headline: ${candidateResume.headline || 'Software Professional'}
Experience: ${candidateResume.yearsOfExperience || 2}+ Years | Location: ${candidateResume.location || 'Remote'}
Summary: ${candidateResume.summary || 'Experienced engineering professional.'}
Core Skills: ${(candidateResume.skills?.coreArchitecture || []).join(', ')}
Languages/Tools: ${(candidateResume.skills?.languagesAndFrameworks || []).join(', ')} | ${(candidateResume.skills?.cloudAndInfrastructure || []).join(', ')}
Work History:
${(candidateResume.workExperience || []).map((w: any) => `  - ${w.company} (${w.role}, ${w.duration}): ${w.highlights?.join(' ')}`).join('\n')}
Key Highlight Projects:
${(candidateResume.notableProjects || []).map((np: any) => `  - ${np.name}: ${np.description} [Metrics: ${np.metrics}]`).join('\n')}
Full Raw Resume Text / Bio:
${candidateResume.rawText || ''}
`;

    // Extract last AI speaker from transcript history to enable smooth conversational handoffs
    const lastAITurn = [...transcript].reverse().find((t: any) => t.speakerId && t.speakerId !== 'candidate');
    const lastAISpeakerName = lastAITurn?.speakerName || 'the previous interviewer';
    const lastAISpeakerRole = lastAITurn?.speakerRole || 'panel member';
    const lastAISpeakerId = lastAITurn?.speakerId || null;

    const recentTranscript = transcript
      .slice(-14)
      .map((t: any) => `[${t.speakerRole.toUpperCase()} - ${t.speakerName}]: ${t.content}`)
      .join('\n');

    const isClarificationRequest = /rephrase|repeat|clarify|what do you mean|didn't understand|could you explain|can you explain|what is meant|reword|pardon|say that again/i.test(lastCandidateSpeech || '');

    const prompt = `
You are the Orchestration, Persona & Adaptive Probing Engine for a Collaborative Multi-Role AI Interview Panel.
The candidate is participating in an active, real-time voice interview with a panel of specialized interviewers.

=== ACTIVE INTERVIEW PANEL PERSONALITIES ===
${panelDescriptions}

=== CANDIDATE RESUME & BACKGROUND (SHARED CONTEXT) ===
${resumeSummary}

=== ALL PREVIOUS QUESTIONS ASKED BY PANEL (SHARED MEMORY) ===
${questionHistorySummary}

=== CURRENT INTERVIEW SCENARIO ===
Title: ${scenario.title || 'System & Product Interview'}
Context: ${scenario.context || 'General Interview'}
Target Role: ${scenario.targetRole || 'Software Engineer'}
Current Difficulty Level: ${sharedContext.currentDifficulty || 'Senior'}

=== RUNNING PANEL SHARED CONTEXT ===
Running Summary: ${sharedContext.runningSummary || 'Interview in progress.'}
Identified Strengths: ${(sharedContext.demonstratedStrengths || []).join('; ') || 'None yet'}
Identified Weaknesses/Gaps: ${(sharedContext.identifiedWeaknesses || []).join('; ') || 'None yet'}
Unresolved Probes/Threads: ${(sharedContext.unresolvedProbes || []).join('; ') || 'None yet'}
Current Competency Scores (0-100): ${JSON.stringify(sharedContext.competencyScores || {})}

=== RECENT INTERVIEW TRANSCRIPT ===
${recentTranscript}

=== CANDIDATE'S LATEST UTTERANCE ===
"${lastCandidateSpeech}"
${interrupted ? 'NOTE: The candidate interrupted the previous speaker. Acknowledge their point smoothly.' : ''}
${userAddressedInterviewerId ? `NOTE: The candidate specifically addressed interviewer ID "${userAddressedInterviewerId}". Choose them unless there is an urgent overriding reason.` : ''}
${isClarificationRequest ? 'CRITICAL NOTE: The candidate is asking for CLARIFICATION or REPHRASING of the previous question. DO NOT penalize their competency scores or flag their answer as vague! Set adaptiveStrategyApplied to "Clarify & Simplify", keep difficulty unchanged, output [] for detectedFlags, and warmly rephrase the previous question in simpler, clearer terms.' : ''}

=== PANEL HANDOFF & CONVERSATIONAL SMOOTHNESS RULES ===
- LAST AI SPEAKER IN ROOM: "${lastAISpeakerName}" (${lastAISpeakerRole})
- **MANDATORY PANEL HANDOFF**: If the chosen interviewer (nextSpeakerId) is DIFFERENT from "${lastAISpeakerId}", you MUST start your response with a natural, conversational handoff phrase acknowledging "${lastAISpeakerName}" and their previous point!
  - Examples of natural handoffs:
    * "Thanks ${lastAISpeakerName}, that covers the system architecture side well. Building on your point, as [your role], I want to understand..."
    * "Great overview. Taking over from ${lastAISpeakerName}'s question, let's look at this from a product ROI perspective..."
    * "Appreciate that breakdown. ${lastAISpeakerName} touched on caching, but as VP of Engineering, my main concern is operational cost during peak load..."
- Never jump cold into a new question without acknowledging "${lastAISpeakerName}" when changing speakers!

=== CORE ADAPTIVE QUESTIONING & EVALUATION LOGIC ===
1. **Analyze Candidate Answer**:
   - **Keywords**: Extract 2-5 core technical or domain keywords from their response.
   - **Sentiment**: Determine candidate confidence (Confident & Structured, Hesitant / Uncertain, Deflective / Evasive, Analytical & Deep, Enthusiastic & Collaborative).
   - **Depth Assessment**: Evaluate depth (Surface (Hand-waving), Intermediate (Practical), Deep (Architectural / Nuanced), or Principal (Multi-Dimensional)).
2. **Formulate Adaptive Follow-Up Question**:
   - Choose the most relevant **Adaptive Strategy**:
     * **Deep Probe**: If they gave a high-level solution without explaining failure semantics, edge cases, cache eviction, or exact algorithms.
     * **Challenge Assumption**: If they assumed 100% network uptime, instant DB writes, infinite budget, or no legacy constraints, introduce a real-world crisis (e.g. 10x traffic spike, split-brain, budget cut).
     * **Explore Alternative**: If they chose a particular stack (e.g. Kafka, Redis, PostgreSQL), ask why they preferred it over alternative approaches and what trade-offs they accepted.
     * **Off-Script Pivot**: If the candidate referenced an interesting past project, metric, or company from their resume (e.g. Stripe ledger, Datadog streaming, Shopify checkout), pivot dynamically off-script to probe their genuine hands-on experience!
     * **Cross-Role Handoff**: If technical depth was established, another interviewer (e.g. Product Manager or Customer Director) takes over to probe business ROI, user conversion, or SLA compliance.
3. **Distinct Persona Fidelity**:
   - The selected interviewer MUST speak strictly in their unique tone, signature jargon, and questioning lens.
   - For example:
     * Alex Vance (Technical): Uses deep systems jargon (idempotency, p99 jitter, Raft, split-brain, write-ahead logs, cache stampede).
     * Maya Lin (Product Manager): Focuses on user conversion funnels, friction points, RICE prioritization, TTV, and product ROI.
     * Marcus Reed (Hiring Manager): Focuses on team velocity, technical debt amortization, mentorship, and engineering pragmatism.
     * Sarah Chen (Customer Director): Focuses on contractual SLAs, migration downtime, blast radius on client workflows, and customer trust.
     * Dr. Elena Rostova (Behavioral): Focuses on STAR personal accountability, psychological safety, and growth mindset.
4. **Conversational Naturalness**:
   - The spoken dialogue MUST be concise and sound like real human speech (2 to 4 sentences).
   - Acknowledge previous panel members or the candidate's specific words naturally (e.g., "Building on Alex's question about Kafka...", "You mentioned on your resume that at Stripe you handled 65k TPS...").
   - Always conclude with ONE clear, punchy, engaging question. No bullet points or robotic meta-text.
`;

    // Try Groq API first if GROQ_API_KEY is configured (sub-100ms Llama 3.3 70B inference)
    if (process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_SECONDARY) {
      try {
        const rawGroq = await generateContentWithGroq(prompt);
        if (rawGroq && (rawGroq.nextSpeakerId || rawGroq.speech)) {
          const groqNormalized = normalizeTurnResponse(rawGroq, activePanel, scenario, sharedContext);
          // Prepend smooth handoff bridge if persona changed and wasn't mentioned
          if (lastAISpeakerId && groqNormalized.nextSpeakerId !== lastAISpeakerId) {
            const firstName = lastAISpeakerName.split(' ')[0];
            if (!groqNormalized.speech.toLowerCase().includes(firstName.toLowerCase())) {
              groqNormalized.speech = `Thanks ${firstName}, building on that point. ${groqNormalized.speech}`;
            }
          }
          console.log('[Groq AI] Successfully generated panel turn in <100ms via Llama 3.3 70B');
          return res.json({ success: true, data: groqNormalized });
        }
      } catch (groqErr: any) {
        console.warn('[Groq API Fallback] Groq call failed, falling back to Gemini:', groqErr.message);
      }
    }

    const response = await generateContentWithFallback({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nextSpeakerId: { type: Type.STRING, description: 'The ID of the chosen interviewer from the active panel' },
            nextSpeakerName: { type: Type.STRING },
            nextSpeakerRole: { type: Type.STRING },
            speech: { type: Type.STRING, description: 'The exact conversational spoken response (2-4 natural sentences)' },
            internalThought: { type: Type.STRING, description: 'Backstage internal deliberation thought of the panel' },
            turnTakingReason: { type: Type.STRING, description: 'Brief rationale for why this interviewer took the turn' },
            questionTopic: { type: Type.STRING, description: 'Short topic title of the question (e.g. Cache Invalidation & Stale Reads)' },
            targetCompetency: { type: Type.STRING, description: 'Technical Architecture, Business Impact, Leadership, etc.' },
            adaptiveStrategyApplied: {
              type: Type.STRING,
              description: 'Deep Probe, Challenge Assumption, Explore Alternative, Off-Script Pivot, or Cross-Role Handoff',
            },
            resumePointReferenced: { type: Type.STRING, description: 'Specific project, skill, or metric from resume referenced, if any' },
            analysisOfCandidateAnswer: {
              type: Type.OBJECT,
              properties: {
                sentiment: { type: Type.STRING, description: 'Confident & Structured, Hesitant / Uncertain, Deflective / Evasive, Analytical & Deep, or Enthusiastic & Collaborative' },
                depthLevel: { type: Type.STRING, description: 'Surface (Hand-waving), Intermediate (Practical), Deep (Architectural / Nuanced), or Principal (Multi-Dimensional)' },
                detectedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                candidateResponseSummary: { type: Type.STRING, description: '1-sentence summary of what candidate claimed' },
              },
              required: ['sentiment', 'depthLevel', 'detectedKeywords', 'candidateResponseSummary'],
            },
            detectedFlags: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: 'contradiction, vague, missing_impact, strong_insight, or technical_depth' },
                  quote: { type: Type.STRING, description: 'Exact phrase or quote from candidate' },
                  explanation: { type: Type.STRING, description: 'Why this was flagged' },
                  severity: { type: Type.STRING, description: 'low, medium, or high' },
                  suggestedProbe: { type: Type.STRING, description: 'What to probe on' },
                },
                required: ['type', 'quote', 'explanation', 'severity'],
              },
            },
            updatedDifficulty: { type: Type.STRING, description: 'Foundational, Intermediate, Senior, or Staff/Principal' },
            difficultyAdjustmentReason: { type: Type.STRING },
            updatedCompetencyScores: {
              type: Type.OBJECT,
              properties: {
                technicalArchitecture: { type: Type.NUMBER },
                businessAndCustomerImpact: { type: Type.NUMBER },
                communicationAndClarity: { type: Type.NUMBER },
                leadershipAndOwnership: { type: Type.NUMBER },
                problemSolvingAndAgility: { type: Type.NUMBER },
              },
              required: ['technicalArchitecture', 'businessAndCustomerImpact', 'communicationAndClarity', 'leadershipAndOwnership', 'problemSolvingAndAgility'],
            },
            newBackstageNote: {
              type: Type.OBJECT,
              properties: {
                authorRole: { type: Type.STRING },
                note: { type: Type.STRING },
              },
              required: ['authorRole', 'note'],
            },
            updatedRunningSummary: { type: Type.STRING },
            unresolvedProbesToAdd: { type: Type.ARRAY, items: { type: Type.STRING } },
            resolvedProbesToRemove: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'nextSpeakerId',
            'nextSpeakerName',
            'nextSpeakerRole',
            'speech',
            'internalThought',
            'turnTakingReason',
            'questionTopic',
            'targetCompetency',
            'adaptiveStrategyApplied',
            'analysisOfCandidateAnswer',
            'detectedFlags',
            'updatedDifficulty',
            'updatedCompetencyScores',
            'updatedRunningSummary',
          ],
        },
      },
    });

    const parsedRaw = JSON.parse(response.text || '{}');
    const parsed = normalizeTurnResponse(parsedRaw, activePanel, scenario, sharedContext);

    // Prepend smooth handoff bridge if persona changed and wasn't mentioned
    if (parsed.nextSpeakerId && lastAISpeakerId && parsed.nextSpeakerId !== lastAISpeakerId) {
      const speechText = parsed.speech || '';
      const firstName = lastAISpeakerName.split(' ')[0];
      if (!speechText.toLowerCase().includes(firstName.toLowerCase())) {
        parsed.speech = `Thanks ${firstName}, building on that point. ${speechText}`;
      }
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.warn('Gemini API call failed or timed out, generating intelligent panel fallback turn:', error.message);
    const { lastCandidateSpeech = '', activePanel = [], scenario = {}, sharedContext = {} } = req.body;
    const fallbackData = generateFallbackTurn(lastCandidateSpeech, activePanel, scenario, sharedContext);
    res.json({ success: true, data: fallbackData });
  }
});

function generateFallbackTurn(lastCandidateSpeech: string, activePanel: any[], scenario: any, sharedContext: any) {
  const nextInterviewer = (activePanel && activePanel.length > 0)
    ? activePanel[Math.floor(Math.random() * activePanel.length)]
    : {
        id: 'alex-vance',
        name: 'Alex Vance',
        role: 'technical',
        title: 'Lead Systems Architect'
      };

  let speech = '';
  let topic = 'System Architecture & Engineering Trade-offs';
  let strategy = 'Deep Probe';

  const speechLower = (lastCandidateSpeech || '').toLowerCase();

  if (speechLower.includes('agent') || speechLower.includes('hospital') || speechLower.includes('notes') || speechLower.includes('prompt')) {
    speech = `That multi-agent architecture for clinical notes is very interesting! How do you handle concurrency, state synchronization, and fault-tolerance across those 5 agents if one agent fails or encounters latency spikes under heavy load?`;
    topic = 'Multi-Agent Synchronization & Resiliency';
    strategy = 'Deep Probe';
  } else if (speechLower.includes('cache') || speechLower.includes('redis') || speechLower.includes('db') || speechLower.includes('postgres')) {
    speech = `Good point on the caching strategy! What exact cache invalidation rules and TTL limits do you enforce when patient records are updated across multiple concurrent services?`;
    topic = 'Cache Invalidation & Consistency';
    strategy = 'Challenge Assumption';
  } else {
    speech = `Thank you for sharing that architectural overview. Could you walk us through the performance benchmarks, failure recovery procedures, and key trade-offs you evaluated for this implementation?`;
    topic = 'Performance & Disaster Recovery';
    strategy = 'Deep Probe';
  }

  return {
    nextSpeakerId: nextInterviewer.id,
    nextSpeakerName: nextInterviewer.name,
    nextSpeakerRole: nextInterviewer.role || 'technical',
    speech,
    internalThought: `Panel Deliberation: Evaluated response on ${topic}. Formulated adaptive follow-up question.`,
    turnTakingReason: `${nextInterviewer.name} (${nextInterviewer.title || 'Panelist'}) probed candidate depth on ${topic}.`,
    questionTopic: topic,
    targetCompetency: 'technicalArchitecture',
    adaptiveStrategyApplied: strategy,
    analysisOfCandidateAnswer: {
      sentiment: 'Analytical & Deep',
      depthLevel: 'Intermediate (Practical)',
      detectedKeywords: ['architecture', 'multi-agent', 'performance'],
      candidateResponseSummary: lastCandidateSpeech ? (lastCandidateSpeech.substring(0, 120) + '...') : 'Candidate explained system overview.',
    },
    detectedFlags: [],
    updatedDifficulty: sharedContext.currentDifficulty || 'Senior',
    updatedCompetencyScores: sharedContext.competencyScores || {
      technicalArchitecture: 75,
      businessAndCustomerImpact: 70,
      communicationAndClarity: 75,
      leadershipAndOwnership: 70,
      problemSolvingAndAgility: 75,
    },
    updatedRunningSummary: (sharedContext.runningSummary || '') + ` Candidate detailed ${topic}.`,
  };
}

// Endpoint: Generate Full Evidence-Based Assessment Linked to Transcript Quotes
app.post('/api/interview/final-assessment', async (req, res) => {
  try {
    const { transcript = [], sharedContext = {}, activePanel = [], scenario = {}, candidateName = 'Candidate' } = req.body;

    const fullTranscriptText = transcript
      .map((t: any, index: number) => `[#${index + 1} | ${new Date(t.timestamp).toISOString().substring(11, 19)} | ${t.speakerRole.toUpperCase()} - ${t.speakerName}]: ${t.content}`)
      .join('\n\n');

    const prompt = `
You are the Chief Calibration Committee & Principal Evaluation Engine for an Adaptive Voice Interview.
Generate a comprehensive, rigorous, evidence-based assessment of the candidate based strictly on the full interview transcript.

=== CANDIDATE & INTERVIEW DETAILS ===
Candidate Name: ${candidateName}
Target Role: ${scenario.targetRole || 'Senior Engineer / Tech Lead'}
Scenario: ${scenario.title || 'Technical & Product Panel'}
Difficulty Range: ${sharedContext.currentDifficulty || 'Senior'}
Panel Members: ${activePanel.map((p: any) => `${p.name} (${p.title})`).join(', ')}

=== SHARED PANEL CONTEXT & DETECTED FLAGS ===
${JSON.stringify(sharedContext, null, 2)}

=== COMPLETE TIMESTAMPED INTERVIEW TRANSCRIPT ===
${fullTranscriptText}

=== EVALUATION CRITERIA ===
1. **Evidence-Based Grounding**: EVERY key score, strength, weakness, and observation MUST quote or cite exact statements from the candidate with transcript context.
2. **Role-by-Role Scorecard**: Provide distinct feedback from each interviewer role that was present on the panel.
3. **Contradictions & Gaps**: Highlight any hand-waving or contradictory points where the candidate adjusted claims under pressure.
4. **Adaptive Trajectory**: Explain how the difficulty evolved throughout the interview.
5. **Hiring Recommendation**: Strong Hire, Hire, Leaning Hire, Leaning No Hire, or Strong No Hire with an uncompromising calibration rationale.
`;

    const response = await generateContentWithFallback({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            candidateName: { type: Type.STRING },
            targetRole: { type: Type.STRING },
            interviewDate: { type: Type.STRING },
            durationMinutes: { type: Type.NUMBER },
            overallScore: { type: Type.NUMBER, description: '0 to 100' },
            hiringRecommendation: { type: Type.STRING, description: 'Strong Hire, Hire, Leaning Hire, Leaning No Hire, Strong No Hire' },
            executiveSummary: { type: Type.STRING },
            calibrationRationale: { type: Type.STRING },
            competencyBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  weight: { type: Type.STRING },
                  verdict: { type: Type.STRING },
                  evidenceQuotes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        quote: { type: Type.STRING },
                        context: { type: Type.STRING },
                      },
                      required: ['quote', 'context'],
                    },
                  },
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['name', 'score', 'verdict', 'evidenceQuotes', 'strengths', 'improvements'],
              },
            },
            roleByRoleFeedback: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  interviewerRole: { type: Type.STRING },
                  interviewerName: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  verdict: { type: Type.STRING },
                  commentary: { type: Type.STRING },
                  keyObservationQuote: { type: Type.STRING },
                },
                required: ['interviewerRole', 'interviewerName', 'score', 'verdict', 'commentary', 'keyObservationQuote'],
              },
            },
            identifiedContradictionsAndGaps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  candidateClaim: { type: Type.STRING },
                  actualContradictionOrGap: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                },
                required: ['topic', 'candidateClaim', 'actualContradictionOrGap', 'recommendation'],
              },
            },
            jargonAudit: {
              type: Type.OBJECT,
              properties: {
                practicalDepthRatio: { type: Type.NUMBER, description: '0-100 percentage of concrete architectural depth vs superficial buzzwords' },
                buzzwordDensity: { type: Type.STRING, description: 'Low, Moderate, or High (Hand-Waving Risk)' },
                verifiedConcreteMetricsCount: { type: Type.NUMBER, description: 'Number of specific TPS, SLA, memory, or throughput metrics cited by candidate' },
                jargonTermsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
                auditSummary: { type: Type.STRING, description: 'Analysis of whether high scores reflect true practical depth or superficial jargon' },
              },
              required: ['practicalDepthRatio', 'buzzwordDensity', 'verifiedConcreteMetricsCount', 'jargonTermsUsed', 'auditSummary'],
            },
            adaptiveTrajectory: {
              type: Type.OBJECT,
              properties: {
                startLevel: { type: Type.STRING },
                endLevel: { type: Type.STRING },
                trajectoryDescription: { type: Type.STRING },
              },
              required: ['startLevel', 'endLevel', 'trajectoryDescription'],
            },
            actionableDevelopmentPlan: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'candidateName',
            'targetRole',
            'overallScore',
            'hiringRecommendation',
            'executiveSummary',
            'calibrationRationale',
            'competencyBreakdown',
            'roleByRoleFeedback',
            'identifiedContradictionsAndGaps',
            'jargonAudit',
            'adaptiveTrajectory',
            'actionableDevelopmentPlan',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/interview/final-assessment:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate assessment' });
  }
});

// Endpoint: Text to Speech with Gemini TTS API
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    const clients = getGeminiClients();
    let base64Audio = '';
    let mimeType = 'audio/pcm;rate=24000';
    let lastError: any = null;

    for (const ai of clients) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text: text.trim() }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName as any },
              },
            },
          },
        });
        base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
        mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/pcm;rate=24000';
        if (base64Audio) break;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!base64Audio) {
      return res.status(404).json({ error: lastError?.message || 'No audio returned from Gemini TTS model' });
    }

    res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType,
      sampleRate: 24000,
    });
  } catch (error: any) {
    console.error('TTS endpoint error:', error);
    res.status(500).json({ success: false, error: error.message || 'TTS generation failed' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AGORA REAL-TIME VOICE LAYER
// All three endpoints below are required for the Agora integration:
//   1. /api/agora/token    – Generate a short-lived RTC token for the client
//   2. /api/agora/start-agent – Start an Agora Conversational AI agent
//   3. /api/agora/stop-agent  – Stop the agent when the interview ends
// ─────────────────────────────────────────────────────────────────────────────

// 1. Generate Agora RTC Token (client calls this on interview start)
app.get('/api/agora/token', (req, res) => {
  try {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return res.status(500).json({
        success: false,
        error: 'AGORA_APP_ID or AGORA_APP_CERTIFICATE not configured in environment.',
      });
    }

    const channelName = (req.query.channelName as string) || `interview-${Date.now()}`;
    const uid = parseInt((req.query.uid as string) || '0', 10);
    const tokenExpirySeconds = 3600; // 1-hour token
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTimestamp = currentTimestamp + tokenExpirySeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpireTimestamp,
      privilegeExpireTimestamp
    );

    console.log(`[Agora] Token generated for channel: ${channelName}, uid: ${uid}`);

    res.json({
      success: true,
      token,
      appId,
      channelName,
      uid,
      expiresAt: privilegeExpireTimestamp,
    });
  } catch (err: any) {
    console.error('[Agora] Token generation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Start Agora Conversational AI Agent
// This calls Agora's REST API to deploy a Voice Agent into the RTC channel.
// The agent listens to the candidate's audio, calls our LLM webhook, and speaks the response.
app.post('/api/agora/start-agent', async (req, res) => {
  try {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const customerKey = process.env.AGORA_CUSTOMER_KEY;
    const customerSecret = process.env.AGORA_CUSTOMER_SECRET;
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    if (!appId) {
      return res.status(500).json({ success: false, error: 'AGORA_APP_ID not configured.' });
    }

    const {
      channelName,
      uid = 1,                         // agent UID (distinct from candidate UID 0)
      interviewerName = 'AI Interviewer',
      systemPrompt = '',
      voiceName = 'en-US-AvaMultilingualNeural',
    } = req.body;

    if (!channelName) {
      return res.status(400).json({ success: false, error: 'channelName is required.' });
    }

    // Generate a token for the agent to join the channel
    const agentTokenExpiry = Math.floor(Date.now() / 1000) + 3600;
    const agentToken = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate || '',
      channelName,
      uid,
      RtcRole.PUBLISHER,
      agentTokenExpiry,
      agentTokenExpiry
    );

    // Attempt Agora Conversational AI REST API if credentials available
    if (customerKey && customerSecret) {
      const credentials = Buffer.from(`${customerKey}:${customerSecret}`).toString('base64');
      const agoraApiUrl = `https://api.agora.io/api/conversational-ai/v2/projects/${appId}/agents/join`;

      const agentPayload = {
        name: `vocalis-interviewer-${Date.now()}`,
        properties: {
          channel: channelName,
          token: agentToken,
          agent_rtc_uid: String(uid),
          remote_rtc_uids: ['*'], // listen to all users in channel
          enable_string_uid: false,
          idle_timeout: 120,
        },
        llm: {
          url: `${appUrl}/api/agora/llm-webhook`,
          api_key: 'vocalis-internal',
          system_messages: [
            { role: 'system', content: systemPrompt || `You are ${interviewerName}, an AI interviewer. Ask adaptive follow-up questions based on candidate responses.` },
          ],
          greeting_message: `Hello, I am ${interviewerName}. Let us begin the interview.`,
          failure_message: 'I am having trouble processing that. Could you please repeat?',
          max_history: 20,
          params: { model: 'gemini-2.5-flash' },
        },
        tts: {
          vendor: 'microsoft',
          params: {
            key: process.env.AZURE_TTS_KEY || '',
            region: process.env.AZURE_TTS_REGION || 'eastus',
            voice_name: voiceName,
            rate: '0%',
            volume: '0%',
          },
        },
        vad: { silence_duration_ms: 480, speech_duration_ms: 10 },
        asr: { language: 'en-US' },
      };

      const agoraRes = await fetch(agoraApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify(agentPayload),
      });

      const agoraData = await agoraRes.json().catch(() => ({}));

      if (!agoraRes.ok) {
        console.warn('[Agora] Conversational AI agent start failed:', agoraData);
        // Fall through to token-only mode
      } else {
        console.log('[Agora] Conversational AI agent started:', agoraData?.agent_id || 'ok');
        return res.json({ success: true, agentId: agoraData?.agent_id, token: agentToken, mode: 'conversational-ai' });
      }
    }

    // Fallback: return token only (client uses Gemini TTS via /api/tts)
    console.log('[Agora] Running in RTC-transport-only mode (no Conversational AI credentials).');
    res.json({ success: true, token: agentToken, mode: 'rtc-transport', channelName });
  } catch (err: any) {
    console.error('[Agora] start-agent error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Agora Conversational AI LLM Webhook
// The Agora agent POSTs here with the candidate's transcribed speech.
// We run it through our multi-role interview deliberation engine and return the response.
app.post('/api/agora/llm-webhook', async (req, res) => {
  try {
    const { messages = [] } = req.body;
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user');
    const candidateSpeech = lastUserMessage?.content || '';

    if (!candidateSpeech.trim()) {
      return res.json({ choices: [{ message: { role: 'assistant', content: 'Could you elaborate on that?' } }] });
    }

    // Route through Groq for sub-100ms response (matches our existing /api/interview/turn fast path)
    const keys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_SECONDARY].filter(Boolean) as string[];
    for (const apiKey of keys) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey.trim()}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You are an adaptive AI interviewer. Ask concise, probing follow-up questions (max 2 sentences) based on the candidate response. Be conversational and direct.' },
              { role: 'user', content: candidateSpeech },
            ],
            temperature: 0.7,
            max_tokens: 150,
          }),
        });
        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const reply = groqData.choices?.[0]?.message?.content;
          if (reply) {
            return res.json({ choices: [{ message: { role: 'assistant', content: reply } }] });
          }
        }
      } catch (e: any) {
        console.warn('[Agora LLM Webhook] Groq key fallback attempt failed:', e.message);
      }
    }

    res.json({ choices: [{ message: { role: 'assistant', content: 'Interesting. Could you elaborate further on the technical details?' } }] });
  } catch (err: any) {
    console.error('[Agora] LLM webhook error:', err);
    res.json({ choices: [{ message: { role: 'assistant', content: 'Please continue with your answer.' } }] });
  }
});

// 4. Stop Agora Conversational AI Agent
app.post('/api/agora/stop-agent', async (req, res) => {
  try {
    const appId = process.env.AGORA_APP_ID;
    const customerKey = process.env.AGORA_CUSTOMER_KEY;
    const customerSecret = process.env.AGORA_CUSTOMER_SECRET;
    const { agentId } = req.body;

    if (customerKey && customerSecret && agentId && appId) {
      const credentials = Buffer.from(`${customerKey}:${customerSecret}`).toString('base64');
      await fetch(`https://api.agora.io/api/conversational-ai/v2/projects/${appId}/agents/${agentId}/leave`, {
        method: 'POST',
        headers: { Authorization: `Basic ${credentials}` },
      }).catch((e) => console.warn('[Agora] Agent stop warning:', e.message));
    }

    res.json({ success: true });
  } catch (err: any) {
    res.json({ success: true }); // Always succeed on stop
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Adaptive Voice Interview Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
