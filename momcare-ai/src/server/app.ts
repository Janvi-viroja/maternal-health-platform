import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import {
  DuplicateEmailError,
  adminDeleteCommunityPost,
  adminUpdateAppointmentStatus,
  adminUpdateUser,
  createAppointmentRecord,
  createCommunityCommentRecord,
  createCommunityPostRecord,
  createDoctorRecord,
  createLocalUser,
  createPostpartumLogRecord,
  createReminderRecord,
  deleteCommunityPostByAuthor,
  deleteReminderRecord,
  ensureSupabaseSeeded,
  generateUniqueUidForName,
  getAdminOverview,
  getDoctorById,
  getHydrationForDate,
  getUserByEmailWithSecret,
  getUserByUid,
  incrementPostLikes,
  listCommunityPostsWithComments,
  listDoctors,
  listPostpartumLogs,
  listUserAppointments,
  listUserReminders,
  setHydrationForDate,
  toggleDoctorAvailability,
  updateReminderRecord,
  updateUserAppointmentStatus,
  updateUserPasswordByEmail,
  updateUserProfile,
} from '../db/repository.ts';
import {
  generateSixDigitOtp,
  signPasswordResetChallenge,
  verifyPasswordResetChallenge,
} from '../lib/passwordReset.ts';
import {
  type AuthRequest,
  hashPassword,
  optionalAuth,
  requireAdmin,
  requireAuth,
  signSessionToken,
  verifyPassword,
} from '../middleware/auth.ts';

dotenv.config();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_APPOINTMENT_STATUSES = new Set([
  'Pending',
  'Confirmed',
  'Completed',
  'Cancelled',
]);
const ALLOWED_BLOOD_GROUPS = new Set([
  'O+',
  'O-',
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
]);

const EMERGENCY_PATTERNS = [
  /heavy bleeding/i,
  /vaginal bleeding/i,
  /bleeding heavily/i,
  /severe abdominal pain/i,
  /sharp belly pain/i,
  /no fetal movement/i,
  /baby stopped moving/i,
  /decreased fetal movement/i,
  /water broke/i,
  /leaking fluid/i,
  /blurred vision/i,
  /severe headache/i,
  /chest pain/i,
  /shortness of breath/i,
  /seizure/i,
  /fainting/i,
  /high fever/i,
  /suicidal/i,
  /self harm/i,
  /hurt myself/i,
];

function parsePositiveInt(raw: unknown): number | null {
  const num = Number(raw);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

function isStrongPassword(password: string, email?: string): string | null {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return 'Password must be between 8 and 128 characters long.';
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include both letters and numbers.';
  }
  if (email && password.toLowerCase() === email.trim().toLowerCase()) {
    return 'Password cannot be identical to your email address.';
  }
  return null;
}

function createRateLimiter(maxRequests: number, windowMs: number) {
  const buckets = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])?.trim() ||
      req.ip ||
      'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const hits = (buckets.get(key) || []).filter((ts) => now - ts < windowMs);

    if (hits.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment and try again.',
      });
    }

    hits.push(now);
    buckets.set(key, hits);

    if (buckets.size > 1000) {
      for (const [k, timestamps] of buckets.entries()) {
        if (timestamps.every((ts) => now - ts >= windowMs)) {
          buckets.delete(k);
        }
      }
    }

    next();
  };
}

let cachedAiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  if (!cachedAiClient) {
    cachedAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAiClient;
}

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Skip re-parsing if serverless wrapper already parsed req.body
  app.use((req, _res, next) => {
    if (
      req.body &&
      typeof req.body === 'object' &&
      !Buffer.isBuffer(req.body) &&
      Object.keys(req.body).length > 0
    ) {
      (req as unknown as { _body?: boolean })._body = true;
    }
    next();
  });

  app.use(express.json({ limit: '1mb' }));

  app.use('/api/auth', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.use('/api/admin', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  const authRateLimit = createRateLimiter(30, 5 * 60 * 1000);
  const aiRateLimit = createRateLimiter(25, 5 * 60 * 1000);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'MomCare AI',
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/auth/register', authRateLimit, async (req, res) => {
    try {
      const {
        fullName,
        email,
        password,
        age,
        pregnancyWeek,
        lmpDate,
        expectedDeliveryDate,
        bloodGroup,
        medicalHistory,
        dietPreference,
      } = req.body ?? {};

      if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
        return res.status(400).json({ error: 'Please enter your full name.' });
      }
      if (fullName.trim().length > 100) {
        return res.status(400).json({ error: 'Full name is too long (max 100 characters).' });
      }

      const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      const pwdError = isStrongPassword(password, normalizedEmail);
      if (pwdError) {
        return res.status(400).json({ error: pwdError });
      }

      let parsedAge: number | null = null;
      if (age !== undefined && age !== null && age !== '') {
        const n = Number(age);
        if (!Number.isFinite(n) || n < 14 || n > 60) {
          return res.status(400).json({ error: 'Age must be between 14 and 60.' });
        }
        parsedAge = Math.round(n);
      }

      let parsedWeek: number | null = null;
      if (pregnancyWeek !== undefined && pregnancyWeek !== null && pregnancyWeek !== '') {
        const w = Number(pregnancyWeek);
        if (!Number.isFinite(w) || w < 1 || w > 42) {
          return res
            .status(400)
            .json({ error: 'Pregnancy week must be between 1 and 42.' });
        }
        parsedWeek = Math.round(w);
      }

      if (lmpDate && (typeof lmpDate !== 'string' || !DATE_REGEX.test(lmpDate))) {
        return res.status(400).json({ error: 'Invalid last period date format.' });
      }
      if (
        expectedDeliveryDate &&
        (typeof expectedDeliveryDate !== 'string' || !DATE_REGEX.test(expectedDeliveryDate))
      ) {
        return res.status(400).json({ error: 'Invalid expected delivery date format.' });
      }

      const cleanBloodGroup =
        bloodGroup && ALLOWED_BLOOD_GROUPS.has(String(bloodGroup))
          ? String(bloodGroup)
          : null;
      const cleanDiet =
        dietPreference === 'non-vegetarian' ? 'non-vegetarian' : 'vegetarian';

      const existing = await getUserByEmailWithSecret(normalizedEmail);
      if (existing) {
        return res.status(409).json({
          error: 'An account with this email already exists. Please sign in instead.',
        });
      }

      const uid = await generateUniqueUidForName(fullName);
      const passwordHash = hashPassword(password);
      const user = await createLocalUser({
        uid,
        email: normalizedEmail,
        passwordHash,
        fullName: fullName.trim(),
        age: parsedAge,
        pregnancyWeek: parsedWeek,
        lmpDate: lmpDate || null,
        expectedDeliveryDate: expectedDeliveryDate || null,
        bloodGroup: cleanBloodGroup,
        medicalHistory:
          typeof medicalHistory === 'string' && medicalHistory.trim()
            ? medicalHistory.trim().slice(0, 1000)
            : null,
        dietPreference: cleanDiet,
      });

      const token = signSessionToken(user.uid);
      res.status(201).json({ token, user });
    } catch (error: unknown) {
      if (error instanceof DuplicateEmailError) {
        return res.status(409).json({ error: error.message });
      }
      const message = error instanceof Error ? error.message : 'Registration failed.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/auth/login', authRateLimit, async (req, res) => {
    try {
      const { email, password } = req.body ?? {};
      const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail) || !password) {
        return res.status(400).json({ error: 'Please enter a valid email and password.' });
      }

      const record = await getUserByEmailWithSecret(normalizedEmail);
      if (!record) {
        return res.status(401).json({
          error: 'No account found for this email. Please create an account first.',
        });
      }
      if (!record.passwordHash) {
        return res.status(401).json({
          error:
            'This account uses Google Sign-In or demo access. Please sign in with Google.',
        });
      }
      if (!record.isActive) {
        return res.status(403).json({ error: 'This account has been deactivated.' });
      }
      if (!verifyPassword(String(password), record.passwordHash)) {
        return res.status(401).json({ error: 'Incorrect password. Please try again.' });
      }

      const { passwordHash: _ph, ...safeUser } = record;
      const token = signSessionToken(record.uid);
      res.json({ token, user: safeUser });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Sign-in failed.';
      res.status(500).json({ error: message });
    }
  });

  // Step 1: Verified Email OTP Request (only delivers via configured Resend email provider; never leaks reset token or allows unauthenticated overwrite)
  app.post('/api/auth/forgot-password', authRateLimit, async (req, res) => {
    try {
      const { email } = req.body ?? {};
      const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }

      const resendKey = process.env.RESEND_API_KEY?.trim();
      const fromEmail =
        process.env.RESET_FROM_EMAIL?.trim() || 'MomCare AI <no-reply@momcare.ai>';

      if (!resendKey) {
        return res.status(503).json({
          configured: false,
          error:
            'Email password reset requires RESEND_API_KEY to be configured on the server. Signed-in users can update their password directly in My Dashboard -> Change Password, or use Google Sign-In.',
        });
      }

      const existing = await getUserByEmailWithSecret(normalizedEmail);
      let challengeToken: string | undefined;

      if (existing && existing.passwordHash) {
        const otp = generateSixDigitOtp();
        const hashPrefix = existing.passwordHash.slice(0, 16);
        challengeToken = signPasswordResetChallenge(normalizedEmail, otp, hashPrefix);

        const mailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [existing.email],
            subject: 'Your MomCare AI Password Reset Code',
            text: `Hello ${existing.fullName},\n\nYour MomCare AI password reset code is: ${otp}\n\nThis code expires in 15 minutes. If you did not request this, you can safely ignore this email.`,
          }),
        });

        if (!mailRes.ok) {
          return res.status(502).json({
            error: 'Unable to send reset email right now. Please try again later.',
          });
        }
      }

      return res.json({
        sent: true,
        challengeToken,
        message:
          'If an email/password account matches that address, a 6-digit verification code has been emailed to you.',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to process request.';
      res.status(500).json({ error: message });
    }
  });

  // Step 2: Confirm OTP + challengeToken and update password
  app.post('/api/auth/reset-password', authRateLimit, async (req, res) => {
    try {
      const { email, otp, challengeToken, newPassword } = req.body ?? {};
      const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }
      if (!otp || typeof otp !== 'string' || !challengeToken || typeof challengeToken !== 'string') {
        return res.status(400).json({ error: 'Verification code and reset session are required.' });
      }
      const pwdError = isStrongPassword(newPassword, normalizedEmail);
      if (pwdError) {
        return res.status(400).json({ error: pwdError });
      }

      const existing = await getUserByEmailWithSecret(normalizedEmail);
      if (!existing || !existing.passwordHash) {
        return res.status(400).json({ error: 'Invalid or expired verification code.' });
      }

      const valid = verifyPasswordResetChallenge(
        challengeToken,
        normalizedEmail,
        otp,
        existing.passwordHash.slice(0, 16)
      );
      if (!valid) {
        return res.status(400).json({ error: 'Invalid or expired verification code.' });
      }

      await updateUserPasswordByEmail(normalizedEmail, hashPassword(newPassword));
      return res.json({
        updated: true,
        message: 'Your password has been updated. You can now sign in with your new password.',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to reset password.';
      res.status(500).json({ error: message });
    }
  });

  // Authenticated password change for local email/password accounts
  app.post('/api/auth/change-password', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body ?? {};
      const record = await getUserByEmailWithSecret(req.authUser!.email);
      if (!record || !record.passwordHash) {
        return res.status(400).json({
          error: 'Password changes are only available for email/password accounts (not Google or Demo accounts).',
        });
      }
      if (!currentPassword || !verifyPassword(String(currentPassword), record.passwordHash)) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
      }
      const pwdError = isStrongPassword(newPassword, record.email);
      if (pwdError) {
        return res.status(400).json({ error: pwdError });
      }

      await updateUserPasswordByEmail(record.email, hashPassword(newPassword));
      res.json({ updated: true, message: 'Password updated successfully.' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to update password.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/auth/demo', authRateLimit, async (req, res) => {
    try {
      const { role } = req.body ?? {};
      const uid = role === 'admin' ? 'demo-admin-kavya' : 'demo-patient-ananya';
      const user = await getUserByUid(uid);
      if (!user) {
        return res.status(404).json({ error: 'Demo profile not found.' });
      }
      if (!user.isActive) {
        return res.status(403).json({ error: 'Demo profile is currently inactive.' });
      }
      const token = signSessionToken(user.uid);
      res.json({ token, user });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unable to start demo session.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
    res.json({ user: req.authUser });
  });

  app.put('/api/auth/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = req.authUser!;
      const {
        fullName,
        age,
        pregnancyWeek,
        lmpDate,
        expectedDeliveryDate,
        bloodGroup,
        medicalHistory,
        dietPreference,
      } = req.body ?? {};

      const cleanName = fullName !== undefined ? String(fullName).trim() : user.fullName;
      if (cleanName.length < 2 || cleanName.length > 100) {
        return res.status(400).json({ error: 'Full name must be between 2 and 100 characters.' });
      }

      let parsedAge: number | null = null;
      if (age !== undefined && age !== '' && age !== null) {
        const n = Number(age);
        if (!Number.isFinite(n) || n < 14 || n > 60) {
          return res.status(400).json({ error: 'Age must be between 14 and 60.' });
        }
        parsedAge = Math.round(n);
      }

      let parsedWeek: number | null = null;
      if (pregnancyWeek !== undefined && pregnancyWeek !== '' && pregnancyWeek !== null) {
        const w = Number(pregnancyWeek);
        if (!Number.isFinite(w) || w < 1 || w > 42) {
          return res.status(400).json({ error: 'Pregnancy week must be between 1 and 42.' });
        }
        parsedWeek = Math.round(w);
      }

      if (lmpDate && (typeof lmpDate !== 'string' || !DATE_REGEX.test(lmpDate))) {
        return res.status(400).json({ error: 'Invalid last period date format.' });
      }
      if (
        expectedDeliveryDate &&
        (typeof expectedDeliveryDate !== 'string' || !DATE_REGEX.test(expectedDeliveryDate))
      ) {
        return res.status(400).json({ error: 'Invalid expected delivery date format.' });
      }

      const cleanBloodGroup =
        bloodGroup === '' || bloodGroup === null
          ? null
          : bloodGroup !== undefined
          ? ALLOWED_BLOOD_GROUPS.has(String(bloodGroup))
            ? String(bloodGroup)
            : user.bloodGroup
          : user.bloodGroup;

      const cleanDiet =
        dietPreference === 'non-vegetarian'
          ? 'non-vegetarian'
          : dietPreference === 'vegetarian'
          ? 'vegetarian'
          : user.dietPreference || 'vegetarian';

      const updated = await updateUserProfile(user.id, {
        fullName: cleanName,
        age: age === undefined ? user.age : parsedAge,
        pregnancyWeek: pregnancyWeek === undefined ? user.pregnancyWeek : parsedWeek,
        lmpDate: lmpDate === undefined ? user.lmpDate : lmpDate || null,
        expectedDeliveryDate:
          expectedDeliveryDate === undefined
            ? user.expectedDeliveryDate
            : expectedDeliveryDate || null,
        bloodGroup: cleanBloodGroup,
        medicalHistory:
          medicalHistory === undefined
            ? user.medicalHistory
            : typeof medicalHistory === 'string' && medicalHistory.trim()
            ? medicalHistory.trim().slice(0, 1000)
            : null,
        dietPreference: cleanDiet,
      });

      res.json({ user: updated });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update profile.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/assistant', optionalAuth, aiRateLimit, async (req: AuthRequest, res) => {
    try {
      const { message, history, weekContext } = req.body ?? {};
      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Please enter a health question.' });
      }
      if (message.trim().length > 2000) {
        return res
          .status(400)
          .json({ error: 'Question is too long (please keep it under 2,000 characters).' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error:
            'Gemini AI service is not configured. Please add GEMINI_API_KEY in Settings > Secrets or Vercel Environment Variables.',
        });
      }

      const user = req.authUser;
      const numericWeek =
        weekContext !== undefined && weekContext !== null && weekContext !== ''
          ? Math.min(42, Math.max(1, Math.round(Number(weekContext))))
          : null;
      const effectiveWeek =
        numericWeek && Number.isFinite(numericWeek) ? numericWeek : user?.pregnancyWeek || null;
      const trimesterLabel = effectiveWeek
        ? effectiveWeek <= 13
          ? 'First Trimester'
          : effectiveWeek <= 27
          ? 'Second Trimester'
          : 'Third Trimester'
        : 'Not specified';

      const hasEmergencyKeyword = EMERGENCY_PATTERNS.some((rx) => rx.test(message));

      const systemInstruction = [
        'You are MomCare AI, a warm, friendly pregnancy and new-mother health helper.',
        'Your role is strictly educational and supportive for pregnant women, expecting mothers, and new mothers.',
        'LANGUAGE STYLE RULE:',
        'Always write in simple, clear, everyday English that any regular person can understand easily. Avoid confusing medical jargon; if you mention a medical term (like glucose test or Tdap), explain what it means in plain words right away.',
        'STRICT MEDICAL SAFETY RULES:',
        '1. NEVER diagnose any disease or medical condition.',
        '2. NEVER prescribe medicines, dosages, or replace a real doctor or hospital visit.',
        '3. If the user describes potential emergency symptoms (such as vaginal bleeding, severe or sharp belly pain, sudden bad headache, blurry vision, swelling of face/hands, high fever, fluid leakage/water breaking, chest pain, trouble breathing, markedly reduced baby movement, or thoughts of self-harm), IMMEDIATELY start your response with an urgent message telling them to call their doctor, maternity clinic, or emergency hospital services right away.',
        '4. Give clear, kind, easy-to-read tips with short bullet points covering normal symptoms, everyday food ideas (including Indian veg and non-veg meals), pregnancy changes, after-birth care, baby growth, and simple questions they can ask their doctor.',
        '5. Keep answers warm, encouraging, and concise (around 120-250 words unless more detail is needed).',
        user
          ? `User context (for helpful tailoring only): Name: ${user.fullName}, Current Week: ${effectiveWeek ?? 'unknown'} (${trimesterLabel}), Diet preference: ${user.dietPreference}.`
          : effectiveWeek
          ? `User shared current pregnancy week: Week ${effectiveWeek} (${trimesterLabel}).`
          : 'User has not shared their current pregnancy week.',
      ].join('\n');

      const conversationParts: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> =
        [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-8)) {
          if (
            item &&
            (item.role === 'user' || item.role === 'model') &&
            typeof item.text === 'string' &&
            item.text.trim()
          ) {
            conversationParts.push({
              role: item.role,
              parts: [{ text: item.text.trim().slice(0, 1500) }],
            });
          }
        }
      }
      conversationParts.push({
        role: 'user',
        parts: [{ text: message.trim() }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: conversationParts,
        config: {
          systemInstruction,
        },
      });

      const reply = response.text?.trim();
      if (!reply) {
        return res.status(502).json({ error: 'The AI assistant returned an empty response.' });
      }

      res.json({
        reply,
        isEmergency: hasEmergencyKeyword,
      });
    } catch (error: unknown) {
      console.error('Gemini API error:', error);
      const errMsg =
        error instanceof Error ? error.message : 'Unable to reach AI health assistant.';
      res.status(502).json({ error: errMsg });
    }
  });

  app.get('/api/doctors', async (_req, res) => {
    try {
      const rows = await listDoctors(false);
      res.json({ doctors: rows });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch doctors.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/appointments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const rows = await listUserAppointments(req.authUser!.id, req.authUser!.uid);
      res.json({ appointments: rows });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch appointments.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/appointments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { doctorId, appointmentDate, timeSlot, consultationType, reason, notes } =
        req.body ?? {};
      const parsedDoctorId = parsePositiveInt(doctorId);
      if (
        !parsedDoctorId ||
        !appointmentDate ||
        !DATE_REGEX.test(String(appointmentDate)) ||
        !timeSlot ||
        !consultationType ||
        !reason ||
        String(reason).trim().length < 3
      ) {
        return res.status(400).json({
          error:
            'Please select an available doctor, valid date, time slot, consultation type, and visit reason.',
        });
      }

      const doctor = await getDoctorById(parsedDoctorId);
      if (!doctor || !doctor.isAvailable) {
        return res.status(404).json({ error: 'Selected doctor is not available.' });
      }

      const created = await createAppointmentRecord({
        userId: req.authUser!.id,
        userUid: req.authUser!.uid,
        doctorId: parsedDoctorId,
        appointmentDate: String(appointmentDate),
        timeSlot: String(timeSlot).trim().slice(0, 40),
        consultationType: String(consultationType).trim().slice(0, 60),
        reason: String(reason).trim().slice(0, 500),
        notes: notes ? String(notes).trim().slice(0, 1000) : undefined,
      });
      res.status(201).json({ appointment: created });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to book appointment.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/appointments/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parsePositiveInt(req.params.id);
      const { status } = req.body ?? {};
      if (!id || status !== 'Cancelled') {
        return res
          .status(400)
          .json({ error: 'Patients can only cancel an existing booked appointment.' });
      }
      const updated = await updateUserAppointmentStatus(
        id,
        req.authUser!.id,
        'Cancelled',
        req.authUser!.uid
      );
      if (!updated) {
        return res.status(404).json({ error: 'Appointment not found.' });
      }
      res.json({ appointment: updated });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to update appointment.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/reminders', requireAuth, async (req: AuthRequest, res) => {
    try {
      const rows = await listUserReminders(req.authUser!.id, req.authUser!.uid);
      res.json({ reminders: rows });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load reminders.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/reminders', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { title, category, dueDate, dueTime, frequency, notes } = req.body ?? {};
      if (
        !title ||
        !String(title).trim() ||
        !category ||
        !dueDate ||
        !DATE_REGEX.test(String(dueDate)) ||
        !dueTime
      ) {
        return res.status(400).json({
          error: 'Title, category, valid date, and time are required for a reminder.',
        });
      }
      const created = await createReminderRecord({
        userId: req.authUser!.id,
        userUid: req.authUser!.uid,
        title: String(title).trim().slice(0, 160),
        category: String(category).trim().slice(0, 60),
        dueDate: String(dueDate),
        dueTime: String(dueTime).trim().slice(0, 30),
        frequency: String(frequency || 'Once').trim().slice(0, 30),
        notes: notes ? String(notes).trim().slice(0, 500) : undefined,
      });
      res.status(201).json({ reminder: created });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create reminder.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/reminders/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parsePositiveInt(req.params.id);
      const { completed, title, category, dueDate, dueTime, frequency, notes } =
        req.body ?? {};
      if (!id) {
        return res.status(400).json({ error: 'Invalid reminder ID.' });
      }
      const updates: {
        completed?: boolean;
        title?: string;
        category?: string;
        dueDate?: string;
        dueTime?: string;
        frequency?: string;
        notes?: string | null;
      } = {};
      if (typeof completed === 'boolean') updates.completed = completed;
      if (typeof title === 'string' && title.trim()) updates.title = title.trim().slice(0, 160);
      if (typeof category === 'string' && category.trim())
        updates.category = category.trim().slice(0, 60);
      if (typeof dueDate === 'string' && DATE_REGEX.test(dueDate)) updates.dueDate = dueDate;
      if (typeof dueTime === 'string' && dueTime.trim())
        updates.dueTime = dueTime.trim().slice(0, 30);
      if (typeof frequency === 'string' && frequency.trim())
        updates.frequency = frequency.trim().slice(0, 30);
      if (notes !== undefined) {
        updates.notes =
          typeof notes === 'string' && notes.trim() ? notes.trim().slice(0, 500) : null;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid reminder updates provided.' });
      }

      const updated = await updateReminderRecord(
        id,
        req.authUser!.id,
        updates,
        req.authUser!.uid
      );
      if (!updated) {
        return res.status(404).json({ error: 'Reminder not found.' });
      }
      res.json({ reminder: updated });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update reminder.';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/reminders/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parsePositiveInt(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Invalid reminder ID.' });
      }
      const deleted = await deleteReminderRecord(id, req.authUser!.id, req.authUser!.uid);
      if (!deleted) {
        return res.status(404).json({ error: 'Reminder not found.' });
      }
      res.json({ deleted: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete reminder.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/hydration', requireAuth, async (req: AuthRequest, res) => {
    try {
      const rawDate = req.query.date ? String(req.query.date) : new Date().toISOString().slice(0, 10);
      if (!DATE_REGEX.test(rawDate)) {
        return res.status(400).json({ error: 'Invalid date format (YYYY-MM-DD expected).' });
      }
      const log = await getHydrationForDate(req.authUser!.id, rawDate, req.authUser!.uid);
      res.json({ hydration: log });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to load hydration log.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/hydration', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { date, glassesCount } = req.body ?? {};
      const logDate = date ? String(date) : new Date().toISOString().slice(0, 10);
      if (!DATE_REGEX.test(logDate)) {
        return res.status(400).json({ error: 'Invalid date format (YYYY-MM-DD expected).' });
      }
      const num = Number(glassesCount ?? 0);
      if (!Number.isFinite(num)) {
        return res.status(400).json({ error: 'Invalid glasses count.' });
      }
      const count = Math.max(0, Math.min(20, Math.round(num)));
      const log = await setHydrationForDate(
        req.authUser!.id,
        logDate,
        count,
        req.authUser!.uid
      );
      res.json({ hydration: log });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to save hydration log.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/community/posts', async (_req, res) => {
    try {
      const posts = await listCommunityPostsWithComments();
      res.json({ posts });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to load community posts.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/community/posts', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { title, content, category } = req.body ?? {};
      if (
        !title ||
        String(title).trim().length < 4 ||
        !content ||
        String(content).trim().length < 10 ||
        !category
      ) {
        return res.status(400).json({
          error: 'Please fill in topic, a clear title (4+ chars), and message (10+ chars).',
        });
      }
      const post = await createCommunityPostRecord({
        userId: req.authUser!.id,
        userUid: req.authUser!.uid,
        authorName: req.authUser!.fullName,
        authorWeek: req.authUser!.pregnancyWeek,
        category: String(category).trim().slice(0, 50),
        title: String(title).trim().slice(0, 180),
        content: String(content).trim().slice(0, 3000),
      });
      res.status(201).json({ post });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to publish post.';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/community/posts/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parsePositiveInt(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Invalid post ID.' });
      }
      const deleted =
        req.authUser!.role === 'admin'
          ? await adminDeleteCommunityPost(id)
          : await deleteCommunityPostByAuthor(id, req.authUser!.id, req.authUser!.uid);
      if (!deleted) {
        return res.status(404).json({ error: 'Post not found or not owned by you.' });
      }
      res.json({ deleted: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete post.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/community/posts/:id/like', async (req, res) => {
    try {
      const id = parsePositiveInt(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Invalid post ID.' });
      }
      const post = await incrementPostLikes(id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found.' });
      }
      res.json({ post });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update likes.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/community/posts/:id/comments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const postId = parsePositiveInt(req.params.id);
      const { content } = req.body ?? {};
      if (!postId || !content || !String(content).trim()) {
        return res.status(400).json({ error: 'Please enter a comment.' });
      }
      const comment = await createCommunityCommentRecord({
        postId,
        userId: req.authUser!.id,
        userUid: req.authUser!.uid,
        authorName: req.authUser!.fullName,
        content: String(content).trim().slice(0, 1000),
      });
      res.status(201).json({ comment });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add comment.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/postpartum/logs', requireAuth, async (req: AuthRequest, res) => {
    try {
      const logs = await listPostpartumLogs(req.authUser!.id, req.authUser!.uid);
      res.json({ logs });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to load recovery logs.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/postpartum/logs', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { logDate, mood, sleepHours, feedingCount, painLevel, notes } = req.body ?? {};
      if (!logDate || !DATE_REGEX.test(String(logDate)) || !mood || !sleepHours) {
        return res
          .status(400)
          .json({ error: 'Valid date, mood, and sleep hours are required.' });
      }
      const parsedSleep = Number(sleepHours);
      if (!Number.isFinite(parsedSleep) || parsedSleep < 0 || parsedSleep > 24) {
        return res.status(400).json({ error: 'Sleep hours must be between 0 and 24.' });
      }
      const parsedFeeds = Math.max(0, Math.min(30, Math.round(Number(feedingCount ?? 0))));
      const parsedPain = Math.max(1, Math.min(10, Math.round(Number(painLevel ?? 2))));

      const log = await createPostpartumLogRecord({
        userId: req.authUser!.id,
        userUid: req.authUser!.uid,
        logDate: String(logDate),
        mood: String(mood).trim().slice(0, 60),
        sleepHours: String(parsedSleep),
        feedingCount: Number.isFinite(parsedFeeds) ? parsedFeeds : 0,
        painLevel: Number.isFinite(parsedPain) ? parsedPain : 2,
        notes: notes ? String(notes).trim().slice(0, 1000) : undefined,
      });
      res.status(201).json({ log });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to save recovery log.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/admin/overview', requireAuth, requireAdmin, async (_req, res) => {
    try {
      const overview = await getAdminOverview();
      res.json(overview);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to load admin overview.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/admin/doctors', requireAuth, requireAdmin, async (req, res) => {
    try {
      const {
        name,
        specialization,
        qualification,
        experienceYears,
        hospital,
        consultationFee,
        languages,
        bio,
      } = req.body ?? {};
      if (!name || !specialization || !qualification || !hospital) {
        return res.status(400).json({
          error: 'Name, specialization, qualification, and hospital are required.',
        });
      }
      const initials = String(name)
        .replace(/^Dr\.?\s*/i, '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('');

      const created = await createDoctorRecord({
        name: String(name).trim().slice(0, 120),
        specialization: String(specialization).trim().slice(0, 120),
        qualification: String(qualification).trim().slice(0, 120),
        experienceYears: Math.max(0, Math.min(70, Math.round(Number(experienceYears || 5)))),
        hospital: String(hospital).trim().slice(0, 140),
        consultationFee: Math.max(0, Math.min(50000, Math.round(Number(consultationFee || 900)))),
        rating: '4.9',
        languages: String(languages || 'English').trim().slice(0, 120),
        bio: String(bio || 'Dedicated maternal and perinatal care specialist.')
          .trim()
          .slice(0, 600),
        imageUrl: `initials:${initials || 'DR'}`,
        availableSlots: JSON.stringify(['09:30 AM', '11:30 AM', '03:00 PM', '05:30 PM']),
      });
      res.status(201).json({ doctor: created });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add doctor.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/admin/doctors/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parsePositiveInt(req.params.id);
      if (!id) return res.status(400).json({ error: 'Invalid doctor ID.' });
      const { isAvailable } = req.body ?? {};
      const updated = await toggleDoctorAvailability(id, Boolean(isAvailable));
      if (!updated) return res.status(404).json({ error: 'Doctor not found.' });
      res.json({ doctor: updated });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update doctor.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/admin/users/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parsePositiveInt(req.params.id);
      if (!id) return res.status(400).json({ error: 'Invalid user ID.' });
      const { isActive, role } = req.body ?? {};
      if (id === req.authUser!.id && isActive === false) {
        return res.status(400).json({ error: 'You cannot deactivate your own admin account.' });
      }
      const updates: { isActive?: boolean; role?: string } = {};
      if (typeof isActive === 'boolean') updates.isActive = isActive;
      if (role === 'patient' || role === 'admin' || role === 'doctor') updates.role = role;
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid user update fields provided.' });
      }
      const updated = await adminUpdateUser(id, updates);
      if (!updated) return res.status(404).json({ error: 'User not found.' });
      res.json({ user: updated });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update user.';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/admin/appointments/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parsePositiveInt(req.params.id);
      const { status } = req.body ?? {};
      if (!id || !status || !ALLOWED_APPOINTMENT_STATUSES.has(String(status))) {
        return res.status(400).json({ error: 'Invalid appointment ID or status.' });
      }
      const updated = await adminUpdateAppointmentStatus(id, String(status));
      if (!updated) return res.status(404).json({ error: 'Appointment not found.' });
      res.json({ appointment: updated });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to update appointment.';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/admin/posts/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parsePositiveInt(req.params.id);
      if (!id) return res.status(400).json({ error: 'Invalid post ID.' });
      const deleted = await adminDeleteCommunityPost(id);
      if (!deleted) return res.status(404).json({ error: 'Post not found.' });
      res.json({ deleted: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove post.';
      res.status(500).json({ error: message });
    }
  });

  // Always return valid JSON for unknown /api/* routes
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // JSON error middleware (e.g., malformed JSON body)
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      if (err instanceof SyntaxError) {
        return res.status(400).json({ error: 'Invalid JSON request body.' });
      }
      const message = err instanceof Error ? err.message : 'Internal server error.';
      return res.status(500).json({ error: message });
    }
    next(err);
  });

  return app;
}

export { ensureSupabaseSeeded };
