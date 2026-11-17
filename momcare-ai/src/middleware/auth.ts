import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateFirebaseUser, getUserByUid } from '../db/repository.ts';

function resolveSessionSecret(): string {
  const configured = process.env.SESSION_SECRET?.trim();
  if (configured && configured.length >= 16) {
    return configured;
  }
  const ephemeral = crypto.randomBytes(32).toString('hex');
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    console.warn(
      'SESSION_SECRET is not set. Using a process-scoped random secret; configure SESSION_SECRET (min 16 chars) in environment variables for persistent sessions.'
    );
  }
  return ephemeral;
}

const SESSION_SECRET = resolveSessionSecret();

export function getSessionSecret(): string {
  return SESSION_SECRET;
}

export interface AuthenticatedUser {
  id: number;
  uid: string;
  email: string;
  role: string;
  fullName: string;
  age: number | null;
  pregnancyWeek: number | null;
  lmpDate: string | null;
  expectedDeliveryDate: string | null;
  bloodGroup: string | null;
  medicalHistory: string | null;
  dietPreference: string;
  isActive: boolean;
}

export interface AuthRequest extends Request {
  authUser?: AuthenticatedUser;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export function signSessionToken(uid: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `mc.${payload}.${sig}`;
}

export function verifySessionToken(token: string): string | null {
  if (!token.startsWith('mc.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!parsed.uid || typeof parsed.exp !== 'number' || Date.now() > parsed.exp) {
      return null;
    }
    return parsed.uid;
  } catch {
    return null;
  }
}

export async function resolveUserFromAuthHeader(
  authHeader?: string
): Promise<AuthenticatedUser | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;

  if (token.startsWith('mc.')) {
    const uid = verifySessionToken(token);
    if (!uid) return null;
    const user = await getUserByUid(uid);
    if (!user || !user.isActive) return null;
    return user;
  }

  const decoded = await adminAuth.verifyIdToken(token);
  const email = decoded.email || `${decoded.uid}@momcare.ai`;
  const fullName = decoded.name || email.split('@')[0] || 'Expectant Mother';
  const emailVerified = Boolean(decoded.email_verified);
  const user = await getOrCreateFirebaseUser(decoded.uid, email, fullName, emailVerified);
  if (!user.isActive) return null;
  return user;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await resolveUserFromAuthHeader(req.headers.authorization);
    if (!user) {
      return res.status(401).json({ error: 'Please sign in to continue.' });
    }
    req.authUser = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired authentication session.' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const user = await resolveUserFromAuthHeader(req.headers.authorization);
    if (user) {
      req.authUser = user;
    }
  } catch {
    // Ignore optional auth failures
  }
  next();
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.authUser || req.authUser.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator privileges required.' });
  }
  next();
};
