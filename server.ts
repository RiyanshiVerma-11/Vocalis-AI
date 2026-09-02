import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { createRequire } from 'module';
import {
  AgoraClient,
  Agent,
  Area,
  DeepgramSTT,
  CustomLLM,
  Groq,
  OpenAI,
  MiniMaxTTS,
  ElevenLabsTTS,
  MicrosoftTTS,
  OpenAITTS,
} from 'agora-agents';

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
    'mixtral-8x7b-32768',
    'meta-llama/llama-4-scout-17b-16e-instruct',
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
      : { id: 'tech-alex', name: 'Rohan Sharma', role: 'technical' };

  const rawSpeakerId = String(raw.nextSpeakerId || '').trim().toLowerCase();
  const rawSpeakerName = String(raw.nextSpeakerName || '').trim().toLowerCase();
  const rawSpeakerRole = String(raw.nextSpeakerRole || '').trim().toLowerCase();
  const speechText = String(raw.speech || '').toLowerCase();

  // Multi-tier flexible matcher for panel persona identification:
  // 1. Exact or partial ID match
  let matchedInterviewer = activePanel.find((p: any) => {
    const pid = String(p.id).toLowerCase();
    return pid === rawSpeakerId || rawSpeakerId.includes(pid) || pid.includes(rawSpeakerId);
  });

  // 2. Persona Full Name or First Name match
  if (!matchedInterviewer && (rawSpeakerName || rawSpeakerId)) {
    matchedInterviewer = activePanel.find((p: any) => {
      const pname = String(p.name).toLowerCase();
      const pFirst = pname.split(' ')[0];
      return (
        pname === rawSpeakerName ||
        pname.includes(rawSpeakerName) ||
        rawSpeakerName.includes(pFirst) ||
        rawSpeakerId.includes(pFirst) ||
        pname.includes(rawSpeakerId)
      );
    });
  }

  // 3. Role match
  if (!matchedInterviewer && (rawSpeakerRole || rawSpeakerId)) {
    matchedInterviewer = activePanel.find((p: any) => {
      const prole = String(p.role).toLowerCase();
      return (
        prole === rawSpeakerRole ||
        prole === rawSpeakerId ||
        rawSpeakerRole.includes(prole) ||
        rawSpeakerId.includes(prole)
      );
    });
  }

  // 4. In-speech self-introduction match (e.g., "Priya here", "I am Vikram", "Dr. Meera here", "Neha from enterprise")
  if (!matchedInterviewer) {
    matchedInterviewer = activePanel.find((p: any) => {
      const pFirst = p.name.split(' ')[0].toLowerCase();
      return speechText.includes(pFirst) || speechText.includes(p.name.toLowerCase());
    });
  }

  if (!matchedInterviewer) {
    matchedInterviewer = fallbackInterviewer;
  }

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
    nextSpeakerName: matchedInterviewer.name,
    nextSpeakerRole: matchedInterviewer.role,
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
    updatedDifficulty: raw.updatedDifficulty || sharedContext.currentDifficulty || 'Intermediate',
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
    isDebateExchange: Boolean(raw.isDebateExchange && Array.isArray(raw.debateDialogue) && raw.debateDialogue.length >= 2),
    debateDialogue: Array.isArray(raw.debateDialogue) && raw.debateDialogue.length >= 2
      ? raw.debateDialogue.map((d: any) => {
          const matched = activePanel.find((p: any) => p.id === d.speakerId || p.role === d.speakerRole) || fallbackInterviewer;
          return {
            speakerId: matched.id,
            speakerName: d.speakerName || matched.name,
            speakerRole: d.speakerRole || matched.role || 'technical',
            speech: d.speech || '',
            internalThought: d.internalThought || undefined,
          };
        })
      : undefined,
    ambientReactions: raw.ambientReactions && typeof raw.ambientReactions === 'object'
      ? raw.ambientReactions
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
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
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

    // ── Resume-First Strict Mode (for Tailored Candidate Resume Interview) ──
    const isResumeFirstMode = (scenario?.id === 'candidate-personalized-interview') ||
      (scenario?.id && String(scenario.id).includes('personalized'));

    // Build a resume anchor bank so every question must cite a real resume element
    const resumeProjects = (candidateResume.notableProjects || []).map((p: any) => `"${p.name}": ${p.description} [Metrics: ${p.metrics}]`);
    const resumeWorkItems = (candidateResume.workExperience || []).map((w: any) => `"${w.role}" at ${w.company} (${w.duration}): ${(w.highlights || []).join('; ')}`);
    const resumeEduItems = (candidateResume.education || []).map((e: any) => `${e.degree} from ${e.institution} (${e.year})`);
    const resumeSkills = [
      ...(candidateResume.skills?.coreArchitecture || []),
      ...(candidateResume.skills?.languagesAndFrameworks || []),
      ...(candidateResume.skills?.cloudAndInfrastructure || []),
      ...(candidateResume.skills?.practicesAndMethodologies || []),
    ];
    const hasRealResume = resumeProjects.length > 0 || resumeWorkItems.length > 0;

    const resumeAnchorBank = hasRealResume ? `
=== ⚠️ RESUME ANCHOR BANK — EVERY QUESTION MUST CITE ONE OF THESE EXACT ITEMS ===
You are STRICTLY FORBIDDEN from asking hypothetical or generic engineering questions.
EVERY SINGLE question you ask MUST reference one of the following real items from this candidate's actual resume:

THEIR ACTUAL PROJECTS (${resumeProjects.length}):
${resumeProjects.map((p: string, i: number) => `  ${i + 1}. ${p}`).join('\n') || '  (No projects found — ask candidate to introduce their most impactful work)'}

THEIR ACTUAL WORK HISTORY (${resumeWorkItems.length}):
${resumeWorkItems.map((w: string, i: number) => `  ${i + 1}. ${w}`).join('\n') || '  (No work experience found — probe academic projects and coursework)'}

THEIR ACADEMIC BACKGROUND:
${resumeEduItems.map((e: string, i: number) => `  ${i + 1}. ${e}`).join('\n') || `  1. ${candidateResume.headline || 'Engineering Background'}`}

THEIR STATED SKILLS & TECHNOLOGIES:
  ${resumeSkills.slice(0, 12).join(', ') || 'Python, JavaScript, System Design'}

ENFORCEMENT RULES:
1. BEFORE formulating any question, pick ONE specific item from the ANCHOR BANK above.
2. Open your question with a reference to it: "I noticed you worked on ${resumeProjects[0]?.split('"')[1] || 'your project'}..." or "At ${resumeWorkItems[0]?.split('"')[1]?.split('"')[0] || 'your previous role'}, you mentioned..."
3. NEVER ask a generic textbook question like "Design a load balancer" unless it is DIRECTLY tied to a challenge they mentioned in their actual resume.
4. If their resume lists specific metrics (e.g. "reduced latency by 40%"), challenge those numbers directly: "You claim 40% latency reduction — what exactly was your baseline and how did you measure that?"
` : '';


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

    // Format candidate's resume highlights across all sections
    const resumeSummary = `
Candidate Name: ${candidateResume.fullName || sharedContext.candidateName || 'Candidate'}
Headline: ${candidateResume.headline || 'Software Professional'}
Experience: ${candidateResume.yearsOfExperience || 2}+ Years | Location: ${candidateResume.location || 'Remote'}
Summary / Bio: ${candidateResume.summary || 'Experienced engineering professional.'}

Academic & Education:
${(candidateResume.education || []).map((e: any) => `  - ${e.degree} | ${e.institution} (${e.year || ''})`).join('\n') || '  - Computer Science & Engineering Background'}

Core Technical Stack & Competencies:
  • Architecture & Systems: ${(candidateResume.skills?.coreArchitecture || []).join(', ') || 'Distributed Systems, API Design'}
  • Languages & Frameworks: ${(candidateResume.skills?.languagesAndFrameworks || []).join(', ') || 'Python, FastAPI, React, TypeScript'}
  • Cloud & Infrastructure: ${(candidateResume.skills?.cloudAndInfrastructure || []).join(', ') || 'Docker, PostgreSQL, Redis, AWS'}
  • Practices & Methodologies: ${(candidateResume.skills?.practicesAndMethodologies || []).join(', ') || 'CI/CD, Agile, Code Reviews'}

Work History & Past Professional Experience:
${(candidateResume.workExperience || []).map((w: any) => `  - Company: "${w.company}", Role: "${w.role}" (${w.duration || 'Past'}): ${w.highlights?.join(' ') || 'Engineering responsibilities'}`).join('\n') || '  - Engineering and software development experience.'}

Notable Projects & Systems Built:
${(candidateResume.notableProjects || []).map((np: any, idx: number) => `  ${idx + 1}. "${np.name}": ${np.description} [Key Metrics: ${np.metrics || 'Production deployed'}]`).join('\n') || '  - Software engineering projects.'}

Full Raw Resume Content:
${candidateResume.rawText || ''}
`;

    // Extract last AI speaker from transcript history to enable smooth conversational handoffs
    const lastAITurn = [...transcript].reverse().find((t: any) => t.speakerId && t.speakerId !== 'candidate');
    const lastAISpeakerName = lastAITurn?.speakerName || activePanel[0]?.name || 'Rohan Sharma';
    const lastAISpeakerRole = lastAITurn?.speakerRole || activePanel[0]?.role || 'technical';
    const lastAISpeakerId = lastAITurn?.speakerId || activePanel[0]?.id || 'alex-vance';

    // ── 360° Comprehensive Full-Resume Section Coverage Engine ──────────
    const notableProjects: any[] = candidateResume.notableProjects || [];
    const workExperiences: any[] = candidateResume.workExperience || [];
    const educationList: any[] = candidateResume.education || [];
    const skillsList = [
      ...(candidateResume.skills?.languagesAndFrameworks || []),
      ...(candidateResume.skills?.coreArchitecture || []),
      ...(candidateResume.skills?.cloudAndInfrastructure || [])
    ];

    const aiTurns = transcript.filter((t: any) => t.speakerId && t.speakerId !== 'candidate');
    const aiTurnsCount = aiTurns.length;

    // Track which resume sections have been probed so far
    const transcriptFullText = transcript.map((t: any) => t.content).join(' ');

    const project1 = notableProjects[0]?.name || 'Primary Project';
    const project2 = notableProjects[1]?.name || null;
    const pastCompany = workExperiences[0]?.company || null;
    const pastRole = workExperiences[0]?.role || null;
    const pastHighlight = workExperiences[0]?.highlights?.[0] || '';
    const educationDegree = educationList[0]?.degree || candidateResume.headline || 'Computer Science';

    // Analyze project mention counts
    const projectStats = notableProjects.map((p: any) => {
      const pName = p.name || '';
      const regex = new RegExp(pName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const mentions = (transcriptFullText.match(regex) || []).length;
      return { name: pName, mentions, description: p.description || '', metrics: p.metrics || '' };
    });

    // Dynamic 360° Resume Section Rotation Agenda
    let currentInterviewPhase = '';
    let targetSectionGoal = '';
    let mandatorySpeakerGuidance = '';

    if (aiTurnsCount === 0) {
      currentInterviewPhase = `SECTION 1: RESUME GREETING & PRIMARY PROJECT OVERVIEW (${project1})`;
      targetSectionGoal = `Welcome the candidate, acknowledge their background in ${educationDegree}, and ask them to walk through the core architecture, key decisions, and data processing of "${project1}".`;
      mandatorySpeakerGuidance = `Rohan Sharma (Technical Architect)`;
    } else if (aiTurnsCount === 1) {
      currentInterviewPhase = `SECTION 1 (CONT.): DEEP TECHNICAL PROBE ON ${project1}`;
      targetSectionGoal = `Ask ONE focused deep-dive follow-up on "${project1}" regarding concurrency, data layer failover, or asynchronous processing. (⚠️ This is the FINAL question allowed on ${project1}).`;
      mandatorySpeakerGuidance = `Rohan Sharma (Technical) or Vikram Malhotra (VP Engineering)`;
    } else if (aiTurnsCount === 2) {
      if (pastCompany) {
        currentInterviewPhase = `SECTION 2: WORK EXPERIENCE & PROFESSIONAL HISTORY (${pastCompany})`;
        targetSectionGoal = `⚠️ MANDATORY PIVOT AWAY FROM ${project1}! Probe candidate's past work experience at "${pastCompany}" as a ${pastRole || 'Software Engineer'}. Ask about their daily engineering responsibilities, specific contributions (${pastHighlight || 'team projects'}), how they collaborated with cross-functional teams, or tools they used.`;
        mandatorySpeakerGuidance = `Vikram Malhotra (VP Engineering / Hiring Manager) or Priya Mehta (Product)`;
      } else if (project2) {
        currentInterviewPhase = `SECTION 2: SECOND PROJECT ON RESUME (${project2})`;
        targetSectionGoal = `⚠️ MANDATORY PIVOT AWAY FROM ${project1}! Pivot to candidate's second project "${project2}" (${notableProjects[1]?.description || ''}). Ask about their technical choices, data pipeline, or why they built it.`;
        mandatorySpeakerGuidance = `Rohan Sharma (Technical) or Priya Mehta (Product)`;
      } else {
        currentInterviewPhase = `SECTION 2: CORE TECH STACK & ARCHITECTURAL SKILLS`;
        targetSectionGoal = `⚠️ MANDATORY PIVOT AWAY FROM ${project1}! Probe their stated skills in (${skillsList.slice(0, 4).join(', ') || 'backend architecture'}). Ask how they design scalable REST/async APIs and handle database query optimization.`;
        mandatorySpeakerGuidance = `Rohan Sharma (Technical Architect) or Vikram Malhotra (VP Engineering)`;
      }
    } else if (aiTurnsCount === 3) {
      if (project2 && pastCompany) {
        currentInterviewPhase = `SECTION 3: SECOND NOTABLE PROJECT ON RESUME (${project2})`;
        targetSectionGoal = `⚠️ PIVOT TO SECOND PROJECT "${project2}"! Probe how "${project2}" differs from their other work, how they structured the data pipeline or user authentication, and what trade-offs they accepted.`;
        mandatorySpeakerGuidance = `Priya Mehta (Principal PM) or Rohan Sharma (Technical)`;
      } else {
        currentInterviewPhase = `SECTION 3: COMPUTER SCIENCE FUNDAMENTALS & ARCHITECTURAL TRADEOFFS`;
        targetSectionGoal = `Explore fundamental CS and engineering judgment: database indexing vs write latency, caching strategies (Redis TTL vs Write-through), or message queues (Kafka vs RabbitMQ).`;
        mandatorySpeakerGuidance = `Rohan Sharma (Technical) or Vikram Malhotra (VP Engineering)`;
      }
    } else if (aiTurnsCount === 4 || aiTurnsCount === 5) {
      currentInterviewPhase = `SECTION 4: PRODUCT ROI, BUSINESS IMPACT & CUSTOMER SLAs`;
      targetSectionGoal = `⚠️ PIVOT TO PRODUCT & CUSTOMER IMPACT! Priya Mehta (Principal PM) or Neha Kapoor (Enterprise Customer) MUST take the floor! Probe how technical decisions impact user conversion, client SLA downtime penalties, customer trust during outages, or business prioritization.`;
      mandatorySpeakerGuidance = `Priya Mehta (Principal PM) or Neha Kapoor (Enterprise Customer)`;
    } else if (aiTurnsCount === 6 || aiTurnsCount === 7) {
      currentInterviewPhase = `SECTION 5: BEHAVIORAL, LEADERSHIP & CONFLICT RESOLUTION (STAR)`;
      targetSectionGoal = `⚠️ PIVOT TO BEHAVIORAL & LEADERSHIP! Dr. Meera Rao (Org Psychologist) or Vikram Malhotra (VP Engineering) MUST take the floor! Ask a structured STAR behavioral question (e.g. resolving a major disagreement over tech debt vs shipping features, handling constructive code review pushback, or learning from an engineering mistake).`;
      mandatorySpeakerGuidance = `Dr. Meera Rao (Lead Psychologist) or Vikram Malhotra (VP Engineering)`;
    } else {
      currentInterviewPhase = `SECTION 6: COMMITTEE SYNTHESIS & CANDIDATE QUESTIONS`;
      targetSectionGoal = `Synthesize candidate's demonstrated signals across all resume sections, acknowledge their strengths, and invite the candidate to ask any questions to the panel before final scoring.`;
      mandatorySpeakerGuidance = `Vikram Malhotra (VP Engineering / Committee Chair)`;
    }

    const isClarificationRequest = /rephrase|repeat|clarify|what do you mean|didn't understand|could you explain|can you explain|what is meant|reword|pardon|say that again/i.test(lastCandidateSpeech || '');

    const recentTranscript = transcript
      .slice(-14)
      .map((t: any) => `[${t.speakerRole.toUpperCase()} - ${t.speakerName}]: ${t.content}`)
      .join('\n');

    const prompt = `
You are the central AI deliberation engine for an adaptive, multi-interviewer committee interview.
The interview panel consists of ${activePanel.length} distinguished interviewers:
${activePanel.map((p: any) => `- ID: "${p.id}", Name: "${p.name}", Role: "${p.role}", Title: "${p.title}"`).join('\n')}
${isResumeFirstMode ? resumeAnchorBank : ''}
=== ⚠️ MANDATORY 360° FULL RESUME EVALUATION & SECTION ROTATION (CRITICAL) ===
CURRENT INTERVIEW TURN: Turn #${aiTurnsCount + 1}
ACTIVE INTERVIEW SECTION: ${currentInterviewPhase}
SECTION MANDATE & GOAL: ${targetSectionGoal}
MANDATORY SPEAKER GUIDANCE: ${mandatorySpeakerGuidance}

ALL RESUME SECTIONS TO COVER ACROSS THE INTERVIEW:
1. Primary Project: "${project1}" (Probed: ${projectStats[0]?.mentions || 0} times)
2. Work Experience: ${pastCompany ? `"${pastCompany}" as ${pastRole}` : 'Professional Experience & Internships'}
3. Secondary Project: ${project2 ? `"${project2}" (${notableProjects[1]?.description || ''})` : 'Secondary Project / Core Stack'}
4. Core Tech Stack: ${skillsList.slice(0, 6).join(', ') || 'Full-Stack & Systems'}
5. Academic Foundation: ${educationDegree}
6. Product ROI & Customer SLAs (Priya Mehta / Neha Kapoor)
7. Behavioral & Leadership STAR (Dr. Meera Rao / Vikram Malhotra)

STRICT PACING & ROTATION CONSTRAINTS:
1. **FULL RESUME COVERAGE**: In a real executive interview, the panel MUST evaluate the candidate across their ENTIRE resume (Work History, Education, Skills, Secondary Project, Business Value, and Behavioral Leadership). NEVER spend more than 2 questions on a single project!
2. **SMOOTH CONVERSATIONAL PIVOTS**: When pivoting between sections, use a natural handoff transition phrase, e.g.:
   - "Thanks Rohan, that gives us strong signal on ${project1}. Shifting gears to your work experience at ${pastCompany || 'your past role'}..."
   - "Great breakdown of the failover architecture. Moving beyond ${project1}, let's look at your second project, ${project2 || 'your other key engineering work'}..."
   - "Appreciate that technical depth. From a product adoption and customer SLA perspective, Priya here..."
3. **SPEAKER ROTATION (ANTI-MONOPOLY)**: The same interviewer ("${lastAISpeakerName}") MUST NOT take more than 2 consecutive turns! Rotate the floor to match ${mandatorySpeakerGuidance}!

=== CANDIDATE RESUME & BACKGROUND (SHARED CONTEXT) ===
${resumeSummary}

=== ALL PREVIOUS QUESTIONS ASKED BY PANEL (SHARED MEMORY) ===
${questionHistorySummary}

=== CURRENT INTERVIEW SCENARIO ===
Title: ${scenario.title || 'System & Product Interview'}
Context: ${scenario.context || 'General Interview'}
Target Role: ${scenario.targetRole || 'Software Engineer'}
Current Difficulty Level: ${sharedContext.currentDifficulty || 'Intermediate'}
${sharedContext.customRubric ? `
=== CUSTOM ENTERPRISE HIRING RUBRIC & LEVELING MATRIX ===
Company Hiring Bar: ${sharedContext.customRubric.companyName} (${sharedContext.customRubric.targetLevel})
Panel Strictness Calibration: ${sharedContext.customRubric.strictnessRating}
Custom Rubric Weights: ${JSON.stringify(sharedContext.customRubric.rubricWeights)}
Mandatory Screening Competencies / Key Signals to Validate:
${(sharedContext.customRubric.keySignals || []).map((s: string) => `  • [POSITIVE SIGNAL] ${s}`).join('\n')}
Disqualifying Red Flags to Probe / Challenge:
${(sharedContext.customRubric.redFlags || []).map((f: string) => `  • [RED FLAG] ${f}`).join('\n')}
Curated Must-Ask Questions from Company Guide:
${(sharedContext.customRubric.mandatoryQuestions || []).map((q: string) => `  • ${q}`).join('\n')}
INSTRUCTION: Interviewers MUST evaluate and challenge the candidate strictly according to this ${sharedContext.customRubric.companyName} bar. If a mandatory question is relevant to the current conversation topic and hasn't been asked yet, prioritize weaving it in naturally!
` : ''}

=== DIFFICULTY TIER CALIBRATION INSTRUCTIONS (MANDATORY) ===
You MUST strictly calibrate the complexity, depth, technical jargon, expectations, and phrasing of the interviewer's question to match the active Difficulty Level ("${sharedContext.currentDifficulty || 'Intermediate'}"):

• FOUNDATIONAL (Junior / Early Career):
  - Focus: Core language features, basic syntax, fundamental algorithms, introductory API usage, simple SQL/Git concepts.
  - Questioning Style: Direct, encouraging, and clear. Ask fundamental questions (e.g., "How do you handle exceptions in your code?", "What is the difference between synchronous and asynchronous calls?").
  - Expectations: Validate baseline competency. Do NOT ask about complex microservices, high concurrency, or distributed cache invalidation.

• INTERMEDIATE (Mid-Level Engineer) [DEFAULT]:
  - Focus: Practical production implementation, clean API design, database indexing, standard design patterns, error handling, unit testing, and component trade-offs.
  - Questioning Style: Practical and scenario-focused (e.g., "How would you structure your API to handle race conditions during order cancellation?", "Why did you choose PostgreSQL over MongoDB for this project?").
  - Expectations: Expect clean modular code, proper error handling, awareness of basic trade-offs, and practical debugging experience.

• SENIOR (Senior Engineer / Tech Lead):
  - Focus: High-scale distributed systems, p99 latency optimization, cache invalidation/stampedes, database sharding/replication, event-driven architectures (Kafka), failure semantics, and explicit business ROI.
  - Questioning Style: Rigorous and probing. Introduce production bottlenecks (e.g. 80,000 req/sec, connection pool exhaustion) and challenge architectural trade-offs.
  - Expectations: Require candidate to defend technical decisions with concrete metrics, failure isolation, and operational SLAs.

• STAFF/PRINCIPAL (Staff/Principal Engineer & Architect):
  - Focus: Multi-system architecture, organization-wide technical roadmap, zero-downtime migrations, multi-region fault tolerance, cross-functional organizational alignment, and long-term business trade-offs.
  - Questioning Style: High ambiguity, strategic, and executive-level (e.g., "How do you align 5 autonomous engineering teams to deprecate a monolith without breaking customer SLAs?").
  - Expectations: Evaluate influence without authority, architectural vision, strategic risk mitigation, and long-term business impact.

=== RUNNING PANEL SHARED CONTEXT ===
Running Summary: ${sharedContext.runningSummary || 'Interview in progress.'}
Identified Strengths: ${(sharedContext.demonstratedStrengths || []).join('; ') || 'None yet'}
Identified Weaknesses/Gaps: ${(sharedContext.identifiedWeaknesses || []).join('; ') || 'None yet'}
Unresolved Probes/Threads: ${(sharedContext.unresolvedProbes || []).join('; ') || 'None yet'}
Current Competency Scores (0-100): ${JSON.stringify(sharedContext.competencyScores || {})}
${sharedContext.architectureDiagram && sharedContext.architectureDiagram.nodes?.length > 0 ? `
=== CANDIDATE'S SHARED SYSTEM DESIGN WHITEBOARD ===
The candidate has sketched and synced the following live architecture diagram on their whiteboard:
Diagram Summary: ${sharedContext.architectureDiagram.diagramSummary || 'Custom System Architecture'}
Nodes/Components:
${sharedContext.architectureDiagram.nodes.map((n: any) => `  • [${n.type.toUpperCase()}] "${n.label}" (Tech: ${n.technology}${n.specs ? `, Specs: ${n.specs}` : ''})`).join('\n')}
Data Flow Connections:
${(sharedContext.architectureDiagram.edges || []).map((e: any) => `  • ${e.from} ──(${e.protocol || 'calls'} ${e.label || ''})──> ${e.to}`).join('\n')}
${sharedContext.architectureDiagram.rawNotes ? `Candidate Notes: "${sharedContext.architectureDiagram.rawNotes}"` : ''}
INSTRUCTION FOR TECHNICAL/ARCHITECTURAL QUESTIONS: If the candidate discusses architecture or references their diagram, the Technical Interviewer or VP of Engineering SHOULD directly cite specific components or connections from this whiteboard (e.g. "I see you're using Redis between your API Gateway and User Service...").
` : ''}

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
     * Rohan Sharma (Technical): Uses deep systems jargon (idempotency, p99 jitter, Raft, split-brain, write-ahead logs, cache stampede).
     * Priya Mehta (Product Manager): Focuses on user conversion funnels, friction points, RICE prioritization, TTV, and product ROI.
     * Vikram Malhotra (Hiring Manager): Focuses on team velocity, technical debt amortization, mentorship, and engineering pragmatism.
     * Neha Kapoor (Customer Director): Focuses on contractual SLAs, migration downtime, blast radius on client workflows, and customer trust.
     * Dr. Meera Rao (Behavioral): Focuses on STAR personal accountability, psychological safety, and growth mindset.
4. **Conversational Naturalness**:
   - The spoken dialogue MUST be concise and sound like real human speech (2 to 4 sentences).
   - Acknowledge previous panel members or the candidate's specific words naturally (e.g., "Building on Rohan's question about Kafka...", "You mentioned on your resume that at Stripe you handled 65k TPS...").
   - Always conclude with ONE clear, punchy, engaging question. No bullet points or robotic meta-text.

5. **PS11 CROSS-INTERVIEWER DEBATES & ROLE TENSIONS (CRITICAL)**:
   - When the candidate's answer reveals a clear cross-role trade-off (e.g., Tech vs Product, Engineering Complexity vs Delivery Timeline, High Scale vs Customer SLA/Cost, Maintenance vs Velocity), generate a **Cross-Interviewer Debate Exchange**:
     * Set 'isDebateExchange': true
     * Set 'debateDialogue' to an array of exactly 2 steps:
       - Step 1: Speaker 1 (e.g. Rohan, Technical) briefly reacts/acknowledges the technical approach (1-2 sentences).
       - Step 2: Speaker 2 (e.g. Priya, Product or Neha, Customer Director) challenges Speaker 1 directly on the trade-off and asks the candidate to resolve the conflict (2 sentences).
     * Example:
       - Step 1 (Rohan): "The multi-region Raft cluster and distributed WALs handle the fault tolerance criteria nicely."
       - Step 2 (Priya): "Hold on Rohan — requiring a 5-node multi-region Raft cluster for this MVP is going to blow our quarterly delivery deadline by two months. Candidate, how would you phase this rollout to deliver customer value without taking on critical SLA risk?"
   - When isDebateExchange is false (standard turn), set isDebateExchange: false and debateDialogue: [].

6. **NON-VERBAL AMBIENT REACTIONS FOR INACTIVE PANELISTS**:
   - For all active panel members who are currently IDLE/INACTIVE (not the main speaker), provide realistic ambient non-verbal cues:
     * 'reactionType': 'nodding' | 'taking_notes' | 'skeptical' | 'intrigued' | 'concerned'
     * 'label': Brief 2-4 word reason (e.g., "Noting Latency SLA", "Skeptical of Cost", "Agreeing on Stack", "SLA Risk Flagged")
     * Map them into 'ambientReactions': { [interviewerId]: { "reactionType": "...", "label": "..." } }
`;

    // Try Groq API first if GROQ_API_KEY is configured (sub-100ms Llama 3.3 70B inference)
    if (process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_SECONDARY) {
      try {
        const rawGroq = await generateContentWithGroq(prompt);
        if (rawGroq && (rawGroq.nextSpeakerId || rawGroq.speech)) {
          const groqNormalized = normalizeTurnResponse(rawGroq, activePanel, scenario, sharedContext);
          // Prepend smooth handoff bridge if persona changed and wasn't mentioned
          if (lastAISpeakerId && groqNormalized.nextSpeakerId !== lastAISpeakerId && !groqNormalized.isDebateExchange) {
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
            isDebateExchange: { type: Type.BOOLEAN, description: 'True if two interviewers disagree/debate in front of candidate' },
            debateDialogue: {
              type: Type.ARRAY,
              description: 'When isDebateExchange is true, array of 2 sequential dialogue turns (Speaker 1 comment, Speaker 2 counter/challenge)',
              items: {
                type: Type.OBJECT,
                properties: {
                  speakerId: { type: Type.STRING },
                  speakerName: { type: Type.STRING },
                  speakerRole: { type: Type.STRING },
                  speech: { type: Type.STRING },
                  internalThought: { type: Type.STRING },
                },
                required: ['speakerId', 'speakerName', 'speakerRole', 'speech'],
              },
            },
            ambientReactions: {
              type: Type.OBJECT,
              description: 'Map of inactive panelist IDs to ambient non-verbal reaction states (nodding, taking_notes, skeptical, intrigued, concerned)',
            },
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
    if (parsed.nextSpeakerId && lastAISpeakerId && parsed.nextSpeakerId !== lastAISpeakerId && !parsed.isDebateExchange) {
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
        name: 'Rohan Sharma',
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
${sharedContext.customRubric ? `
=== CUSTOM COMPANY HIRING BAR & LEVELING RUBRIC ===
Calibrated for: ${sharedContext.customRubric.companyName} (${sharedContext.customRubric.targetLevel})
Strictness Bar: ${sharedContext.customRubric.strictnessRating}
Custom Competency Weights: ${JSON.stringify(sharedContext.customRubric.rubricWeights)}
Key Signals Evaluated: ${(sharedContext.customRubric.keySignals || []).join('; ')}
Disqualifying Red Flags: ${(sharedContext.customRubric.redFlags || []).join('; ')}
INSTRUCTION: Ground the final hiring recommendation ("Strong Hire" vs "No Hire") and calibration rationale directly against this ${sharedContext.customRubric.companyName} standard!
` : ''}

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

// Active Agora Conversational AI Agent Sessions
const activeAgoraSessions = new Map<string, any>();

// 2. Start Agora Conversational AI Agent (Official agora-agents SDK)
// Uses the official TypeScript SDK to deploy a cloud voice agent into the RTC channel.
// Architecture:
//   Candidate Mic → Agora RTC → Agent ASR (Deepgram Nova-3)
//   → Agent LLM (Groq llama-3.3-70b / CustomLLM webhook / OpenAI managed)
//   → Agent TTS (MiniMax managed / ElevenLabs BYOK / Microsoft BYOK)
//   → Agent audio stream → Client speaker output (low-latency WebRTC)
app.post('/api/agora/start-agent', async (req, res) => {
  try {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    if (!appId || !appCertificate) {
      return res.status(500).json({ success: false, error: 'AGORA_APP_ID or AGORA_APP_CERTIFICATE not configured.' });
    }

    const {
      channelName,
      uid = '1',                        // agent UID (distinct from candidate UID 0)
      interviewerName = 'AI Interviewer',
      systemPrompt = '',
      voiceName = '',
    } = req.body;

    if (!channelName) {
      return res.status(400).json({ success: false, error: 'channelName is required.' });
    }

    // ── Build Agora SDK client ──────────────────────────────────────────────────
    // App credentials mode auto-generates signed tokens per session
    const agoraClient = new AgoraClient({
      appId,
      appCertificate,
      area: Area.US,
    });

    // ── ASR: Deepgram Nova-3 (Agora managed — no API key needed) ───────────────
    const stt = new DeepgramSTT({
      model: 'nova-3',
      language: 'en-US',
    });

    // ── LLM: Groq (llama-3.3-70b-versatile, <100ms) or CustomLLM or OpenAI ────
    // If public APP_URL is available (not localhost), we can route to our webhook.
    // Otherwise, Groq runs directly from Agora Cloud for instant turn-taking.
    let llm: any;
    const isPublicUrl = Boolean(appUrl && !appUrl.includes('localhost') && !appUrl.includes('127.0.0.1'));

    if (isPublicUrl) {
      llm = new CustomLLM({
        url: `${appUrl}/api/agora/llm-webhook`,
        apiKey: 'vocalis-internal',
        model: 'custom',
        systemMessages: [
          {
            role: 'system',
            content: systemPrompt ||
              `You are ${interviewerName}, an expert AI interviewer. Ask concise, probing, adaptive follow-up questions (2-3 sentences max).`,
          },
        ],
        greetingMessage: `Hello! I am ${interviewerName}. Let's begin the interview. Please introduce yourself.`,
        failureMessage: 'I did not catch that clearly. Could you please repeat or elaborate?',
        maxHistory: 20,
      });
      console.log('[Agora] LLM: CustomLLM webhook ->', `${appUrl}/api/agora/llm-webhook`);
    } else if (process.env.GROQ_API_KEY) {
      llm = new Groq({
        apiKey: process.env.GROQ_API_KEY.trim(),
        url: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.3-70b-versatile',
        systemMessages: [
          {
            role: 'system',
            content: systemPrompt ||
              `You are ${interviewerName}, an expert AI interviewer conducting an adaptive technical interview. Ask concise, probing follow-up questions (2-3 sentences max). Be direct, professional, and adaptive.`,
          },
        ],
        greetingMessage: `Hello! I am ${interviewerName}. Let's begin the interview. Please introduce yourself and your background.`,
        failureMessage: 'I did not catch that clearly. Could you please repeat or elaborate?',
        maxHistory: 20,
      });
      console.log('[Agora] LLM: Groq (llama-3.3-70b-versatile, cloud direct)');
    } else {
      llm = new OpenAI({
        model: 'gpt-4o-mini',
        systemMessages: [
          {
            role: 'system',
            content: systemPrompt || `You are ${interviewerName}, an expert AI interviewer.`,
          },
        ],
        greetingMessage: `Hello! I am ${interviewerName}. Let's begin the interview. Please introduce yourself.`,
        failureMessage: 'I did not catch that clearly. Could you please repeat or elaborate?',
        maxHistory: 20,
      });
      console.log('[Agora] LLM: OpenAI gpt-4o-mini (Agora managed)');
    }

    // ── TTS: Select vendor based on available credentials ──────────────────────
    let tts: any;
    if (process.env.ELEVENLABS_API_KEY) {
      tts = new ElevenLabsTTS({
        key: process.env.ELEVENLABS_API_KEY,
        modelId: 'eleven_flash_v2_5',
        voiceId: process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB', // Adam
        baseUrl: 'wss://api.elevenlabs.io/v1/text-to-speech',
      });
      console.log('[Agora] TTS: ElevenLabs (BYOK)');
    } else if (process.env.AZURE_TTS_KEY) {
      tts = new MicrosoftTTS({
        key: process.env.AZURE_TTS_KEY,
        region: process.env.AZURE_TTS_REGION || 'eastus',
        voiceName: voiceName || 'en-US-AriaNeural',
      });
      console.log('[Agora] TTS: Microsoft Azure (BYOK)');
    } else if (process.env.OPENAI_API_KEY) {
      tts = new OpenAITTS({
        apiKey: process.env.OPENAI_API_KEY,
        model: 'tts-1',
        baseUrl: 'https://api.openai.com/v1',
        voice: 'alloy',
      });
      console.log('[Agora] TTS: OpenAI (BYOK)');
    } else {
      // MiniMax — Agora managed (no key needed, high quality natural speech)
      tts = new MiniMaxTTS({
        model: 'speech-2.6-turbo',
        voiceId: 'English_captivating_female1',
      });
      console.log('[Agora] TTS: MiniMax (Agora managed)');
    }

    // ── Compose and start the agent ────────────────────────────────────────────
    const agent = new Agent({ client: agoraClient })
      .withStt(stt)
      .withLlm(llm)
      .withTts(tts);

    const sessionName = `vocalis-${interviewerName.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()}-${Date.now()}`;

    const session = agent.createSession({
      channel: channelName,
      agentUid: String(uid),
      remoteUids: ['0'],              // candidate always joins as UID 0
      name: sessionName,
      idleTimeout: 120,               // auto-stop after 120s silence
    });

    console.log(`[Agora] Starting Conversational AI agent on channel: ${channelName} (interviewer: ${interviewerName})...`);
    const agentId = await session.start();
    activeAgoraSessions.set(agentId, session);
    console.log(`[Agora] Conversational AI Agent STARTED. Agent ID: ${agentId}`);

    return res.json({
      success: true,
      agentId,
      mode: 'conversational-ai',
      channelName,
    });
  } catch (err: any) {
    console.error('[Agora] start-agent error:', err);
    // If agent fails to start, return rtc-transport fallback
    res.status(500).json({ success: false, error: err.message, mode: 'rtc-transport' });
  }
});

// 2b. Speak through live Agora Conversational AI Agent (Cloud MiniMax TTS Stream)
app.post('/api/agora/speak', async (req, res) => {
  try {
    const { agentId, text } = req.body;
    if (!agentId || !text) {
      return res.status(400).json({ success: false, error: 'agentId and text are required.' });
    }
    const session = activeAgoraSessions.get(agentId);
    if (session) {
      await session.say(text);
      console.log(`[Agora ConvoAI] Agent ${agentId} speaking: "${text.slice(0, 60)}..."`);
      return res.json({ success: true });
    }
    return res.status(404).json({ success: false, error: 'Agent session not found or inactive.' });
  } catch (err: any) {
    console.warn('[Agora] speak error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Agora Conversational AI LLM Webhook
// The Agora agent POSTs here with the candidate's transcribed speech + full conversation history.
// We run it through Groq (sub-100ms) with the full adaptive interview system prompt.
// This is the core intelligence layer: adaptive questioning, difficulty adjustment, contradiction detection.
app.post('/api/agora/llm-webhook', async (req, res) => {
  try {
    const { messages = [] } = req.body;

    if (!messages.length) {
      return res.json({ choices: [{ message: { role: 'assistant', content: 'Could you elaborate on that?' } }] });
    }

    // Extract full conversation history — pass it to Groq so the interviewer has full context
    // This enables: adaptive follow-ups, contradiction detection, difficulty escalation
    const conversationHistory = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    }));

    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user');
    const candidateSpeech = lastUserMessage?.content || '';

    if (!candidateSpeech.trim()) {
      return res.json({ choices: [{ message: { role: 'assistant', content: 'Could you elaborate on that?' } }] });
    }

    // Adaptive interviewer system prompt — drives all PS11 behaviors:
    // - Multi-turn adaptive questioning based on candidate's previous answers
    // - Difficulty adjustment (probe deeper on strong answers, scaffold on weak ones)
    // - Contradiction & vagueness detection
    // - Role-appropriate technical/behavioral focus
    const adaptiveSystemPrompt = `You are an expert AI technical interviewer conducting a real-time voice interview.
Your role: Ask ONE concise, adaptive follow-up question (2-3 sentences max) based on the candidate's most recent answer.

ADAPTIVE BEHAVIOR RULES:
- If the answer is technically STRONG and detailed: escalate difficulty, probe edge cases, failure modes, or trade-offs
- If the answer is VAGUE or buzzword-heavy: ask for specific technical details or a concrete example
- If the answer is WEAK or incorrect: gently probe to see if they can self-correct; suggest they "walk through it step by step"
- If the answer CONTRADICTS an earlier statement: politely point it out ("Earlier you mentioned X, but now you're saying Y - can you clarify?")
- Focus on: distributed systems, scalability, real-world impact, and concrete technical depth

VOICE INTERVIEW STYLE:
- Speak naturally, conversationally - this is a spoken interview, not written
- Start directly with your question (no "Great answer!" filler)
- Keep responses under 40 words for natural conversation flow
- Reference the candidate's specific words when probing ("You mentioned Kafka - what happens when...")`;

    // Route through Groq for sub-100ms response
    const keys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_SECONDARY].filter(Boolean) as string[];
    for (const apiKey of keys) {
      try {
        const groqMessages = [
          { role: 'system', content: adaptiveSystemPrompt },
          ...conversationHistory,
        ];

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey.trim()}` },
          body: JSON.stringify({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: groqMessages,
            temperature: 0.75,
            max_tokens: 120,
          }),
        });
        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const reply = groqData.choices?.[0]?.message?.content?.trim();
          if (reply) {
            console.log(`[Agora LLM Webhook] Response (${reply.split(' ').length} words): "${reply.slice(0, 80)}..."`);
            return res.json({ choices: [{ message: { role: 'assistant', content: reply } }] });
          }
        }
      } catch (e: any) {
        console.warn('[Agora LLM Webhook] Groq attempt failed:', e.message);
      }
    }

    // Gemini fallback if Groq is unavailable
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const model = genAI.models;
        const geminiRes = await model.generateContent({
          model: 'gemini-2.0-flash',
          contents: [{ role: 'user', parts: [{ text: `${adaptiveSystemPrompt}\n\nCandidate said: "${candidateSpeech}"\n\nYour adaptive follow-up question:` }] }],
        });
        const geminiReply = geminiRes.text?.trim();
        if (geminiReply) {
          return res.json({ choices: [{ message: { role: 'assistant', content: geminiReply } }] });
        }
      } catch (geminiErr: any) {
        console.warn('[Agora LLM Webhook] Gemini fallback failed:', geminiErr.message);
      }
    }

    res.json({ choices: [{ message: { role: 'assistant', content: 'Can you walk me through the specific technical trade-offs you considered?' } }] });
  } catch (err: any) {
    console.error('[Agora] LLM webhook error:', err);
    res.json({ choices: [{ message: { role: 'assistant', content: 'Please continue with your answer.' } }] });
  }
});

// 4. Stop Agora Conversational AI Agent (Official agora-agents SDK)
app.post('/api/agora/stop-agent', async (req, res) => {
  try {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const { agentId } = req.body;

    if (agentId) {
      const session = activeAgoraSessions.get(agentId);
      if (session) {
        await session.stop().catch(() => {});
        activeAgoraSessions.delete(agentId);
        console.log(`[Agora] Session for agent ${agentId} stopped cleanly via session.stop().`);
      } else if (appId && appCertificate) {
        const agoraClient = new AgoraClient({
          appId,
          appCertificate,
          area: Area.US,
        });
        await agoraClient.stopAgent(agentId).catch(() => {});
        console.log(`[Agora] Agent ${agentId} stopped via agoraClient.stopAgent().`);
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    console.warn('[Agora] stop-agent warning (non-fatal):', err.message);
    res.json({ success: true }); // Always succeed on stop — interview already ended
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// LIVEAVATAR REAL-TIME VIDEO STREAMING LAYER
// Uses LiveAvatar LITE mode: we control STT/LLM/TTS, LiveAvatar renders video
// Docs: https://docs.liveavatar.com/docs/lite-mode/overview.md
// ─────────────────────────────────────────────────────────────────────────────

// 5. Create LiveAvatar LITE Session Token + Start Session
app.post('/api/liveavatar/start-session', async (req, res) => {
  try {
    const liveAvatarKey = process.env.LIVE_AVATAR_API_KEY;
    if (!liveAvatarKey) {
      return res.status(500).json({ success: false, error: 'LIVE_AVATAR_API_KEY not configured.' });
    }

    const { avatarId, isSandbox = true } = req.body;

    let resolvedAvatarId = avatarId;

    // If no avatarId given, find a sandbox-compatible public avatar automatically
    if (!resolvedAvatarId) {
      const avatarsRes = await fetch('https://api.liveavatar.com/v1/avatars/public?limit=100', {
        headers: { 'X-API-KEY': liveAvatarKey }
      });
      const avatarsData = await avatarsRes.json();
      const publicAvatars: any[] = avatarsData.data?.results || [];

      for (const av of publicAvatars) {
        const tokenTestRes = await fetch('https://api.liveavatar.com/v1/sessions/token', {
          method: 'POST',
          headers: { 'X-API-KEY': liveAvatarKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'LITE', avatar_id: av.id, is_sandbox: isSandbox })
        });
        if (tokenTestRes.ok) {
          resolvedAvatarId = av.id;
          console.log(`[LiveAvatar] Using sandbox-compatible avatar: "${av.name}" (${av.id})`);
          break;
        }
      }
    }

    if (!resolvedAvatarId) {
      return res.status(404).json({ success: false, error: 'No sandbox-compatible avatar found. Try with is_sandbox: false.' });
    }

    // Create session token
    const tokenRes = await fetch('https://api.liveavatar.com/v1/sessions/token', {
      method: 'POST',
      headers: { 'X-API-KEY': liveAvatarKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'LITE', avatar_id: resolvedAvatarId, is_sandbox: isSandbox })
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.data?.session_token) {
      return res.status(500).json({ success: false, error: 'Failed to create session token.', details: tokenData });
    }

    const { session_id, session_token } = tokenData.data;
    console.log(`[LiveAvatar] Session token created: ${session_id}`);

    // Start the session
    const startRes = await fetch('https://api.liveavatar.com/v1/sessions/start', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session_token}`, 'Content-Type': 'application/json' }
    });
    const startData = await startRes.json();
    if (!startRes.ok || !startData.data?.livekit_url) {
      return res.status(500).json({ success: false, error: 'Failed to start LiveAvatar session.', details: startData });
    }

    const { livekit_url, livekit_client_token, ws_url } = startData.data;
    console.log(`[LiveAvatar] Session STARTED! LiveKit: ${livekit_url} | WS: ${ws_url}`);

    res.json({
      success: true,
      sessionId: session_id,
      sessionToken: session_token,
      livekitUrl: livekit_url,
      livekitClientToken: livekit_client_token,
      wsUrl: ws_url,
      avatarId: resolvedAvatarId,
    });
  } catch (err: any) {
    console.error('[LiveAvatar] start-session error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Stop LiveAvatar Session
app.post('/api/liveavatar/stop-session', async (req, res) => {
  try {
    const { sessionId, sessionToken } = req.body;
    if (sessionId && sessionToken) {
      await fetch(`https://api.liveavatar.com/v1/sessions/${sessionId}/stop`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      }).catch((e: any) => console.warn('[LiveAvatar] Stop warning:', e.message));
      console.log(`[LiveAvatar] Session ${sessionId} stopped.`);
    }
    res.json({ success: true });
  } catch (_) {
    res.json({ success: true });
  }
});

// 7. List LiveAvatar Public Avatars
app.get('/api/liveavatar/avatars', async (_req, res) => {
  try {
    const liveAvatarKey = process.env.LIVE_AVATAR_API_KEY;
    if (!liveAvatarKey) return res.status(500).json({ success: false, error: 'LIVE_AVATAR_API_KEY not configured.' });
    const r = await fetch('https://api.liveavatar.com/v1/avatars/public?limit=100', {
      headers: { 'X-API-KEY': liveAvatarKey }
    });
    const data = await r.json();
    res.json({ success: true, avatars: data.data?.results || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Adaptive Voice Interview Platform running on http://localhost:${PORT}`);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server } },
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
}

startServer();
