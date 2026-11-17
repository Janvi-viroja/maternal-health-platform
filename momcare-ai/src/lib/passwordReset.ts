import crypto from 'node:crypto';
import { getSessionSecret } from '../middleware/auth.ts';

const RESET_TTL_MS = 15 * 60 * 1000;

function getResetSecret(): string {
  return (
    process.env.SESSION_SECRET?.trim() ||
    process.env.PASSWORD_RESET_SECRET?.trim() ||
    getSessionSecret()
  );
}

export function generateSixDigitOtp(): string {
  const num = crypto.randomInt(100000, 1000000);
  return String(num);
}

export function signPasswordResetChallenge(
  email: string,
  otp: string,
  currentHashPrefix: string
): string {
  const secret = getResetSecret();
  if (!secret) {
    throw new Error('Password reset signing secret is not configured.');
  }
  const exp = Date.now() + RESET_TTL_MS;
  const normalizedEmail = email.trim().toLowerCase();
  const payload = Buffer.from(
    JSON.stringify({ email: normalizedEmail, exp })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${payload}.${otp}.${currentHashPrefix}`)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyPasswordResetChallenge(
  token: string,
  email: string,
  otp: string,
  currentHashPrefix: string
): boolean {
  const secret = getResetSecret();
  if (!secret || !token || !otp) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      email?: string;
      exp?: number;
    };
    if (
      !parsed.email ||
      parsed.email !== email.trim().toLowerCase() ||
      typeof parsed.exp !== 'number' ||
      Date.now() > parsed.exp
    ) {
      return false;
    }

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${payload}.${otp.trim()}.${currentHashPrefix}`)
      .digest('base64url');

    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}
