import { describe, expect, it } from 'vitest';
import { calculatePregnancyDates, getWeekDetails } from '../../src/data/pregnancyData';
import { parseJsonResponse } from '../../src/lib/http';
import {
  generateSixDigitOtp,
  signPasswordResetChallenge,
  verifyPasswordResetChallenge,
} from '../../src/lib/passwordReset';
import {
  hashPassword,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
} from '../../src/middleware/auth';

describe('Pregnancy Calculator & Weekly Data', () => {
  it('computes EDD accurately (+280 days) without timezone day-shift', () => {
    const res = calculatePregnancyDates({ lmpDate: '2026-06-01' });
    expect(res).not.toBeNull();
    expect(res!.lmpDate).toBe('2026-06-01');
    expect(res!.expectedDeliveryDate).toBe('2027-03-08');
  });

  it('derives matching LMP when EDD is provided', () => {
    const res = calculatePregnancyDates({ eddDate: '2027-03-08' });
    expect(res).not.toBeNull();
    expect(res!.lmpDate).toBe('2026-06-01');
    expect(res!.expectedDeliveryDate).toBe('2027-03-08');
  });

  it('rejects invalid calendar dates like Feb 30 or malformed strings', () => {
    expect(calculatePregnancyDates({ lmpDate: '2026-02-30' })).toBeNull();
    expect(calculatePregnancyDates({ lmpDate: 'not-a-date' })).toBeNull();
  });

  it('clamps week details cleanly from week 4 to week 40', () => {
    const early = getWeekDetails(1);
    expect(early.week).toBe(4);
    expect(early.trimester).toBe(1);
    expect(early.sizeComparison).toBe('Poppy Seed');

    const mid = getWeekDetails(24);
    expect(mid.trimester).toBe(2);
    expect(mid.sizeComparison).toBe('Cantaloupe');

    const late = getWeekDetails(45);
    expect(late.week).toBe(40);
    expect(late.trimester).toBe(3);
    expect(late.sizeComparison).toBe('Watermelon');
  });
});

describe('Password Hashing, Session Tokens & Reset Challenge', () => {
  it('hashes and verifies strong passwords using scrypt timing-safe comparison', () => {
    const hash = hashPassword('MomCare2026!');
    expect(hash).toContain(':');
    expect(verifyPassword('MomCare2026!', hash)).toBe(true);
    expect(verifyPassword('WrongPass123', hash)).toBe(false);
  });

  it('signs and verifies HMAC session tokens and rejects tampered payloads', () => {
    const token = signSessionToken('patient-uid-123');
    expect(verifySessionToken(token)).toBe('patient-uid-123');

    const tampered = `${token.slice(0, -2)}xx`;
    expect(verifySessionToken(tampered)).toBeNull();
    expect(verifySessionToken('invalid-token')).toBeNull();
  });

  it('generates 6-digit OTPs and verifies bound reset challenges', () => {
    const otp = generateSixDigitOtp();
    expect(otp).toMatch(/^\d{6}$/);

    const challenge = signPasswordResetChallenge('Meera@Example.com', otp, 'abcdef1234567890');
    expect(
      verifyPasswordResetChallenge(challenge, 'meera@example.com', otp, 'abcdef1234567890')
    ).toBe(true);
    expect(
      verifyPasswordResetChallenge(challenge, 'other@example.com', otp, 'abcdef1234567890')
    ).toBe(false);
    expect(
      verifyPasswordResetChallenge(challenge, 'meera@example.com', '000000', 'abcdef1234567890')
    ).toBe(false);
    expect(
      verifyPasswordResetChallenge(challenge, 'meera@example.com', otp, 'changedhashprefix')
    ).toBe(false);
  });
});

describe('Safe HTTP JSON Parser', () => {
  it('throws clear message instead of Unexpected token T on plain-text 404 responses', async () => {
    const res = new Response('The page could not be found\n\nNOT_FOUND', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
    await expect(parseJsonResponse(res)).rejects.toThrow('Request failed with status 404.');
  });

  it('extracts structured server JSON error messages cleanly', async () => {
    const res = new Response(JSON.stringify({ error: 'Invalid credentials.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
    await expect(parseJsonResponse(res)).rejects.toThrow('Invalid credentials.');
  });

  it('throws descriptive non-JSON error when 200 OK serves HTML instead of JSON', async () => {
    const res = new Response('<!doctype html><html></html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
    await expect(parseJsonResponse(res)).rejects.toThrow(/non-JSON response/);
  });

  it('returns parsed payload on valid JSON 200 response', async () => {
    const res = new Response(JSON.stringify({ ok: true, count: 4 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await parseJsonResponse<{ ok: boolean; count: number }>(res);
    expect(data).toEqual({ ok: true, count: 4 });
  });
});
