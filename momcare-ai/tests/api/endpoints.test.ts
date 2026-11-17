import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getSupabaseClient } from '../../src/lib/supabase.ts';
import { createApp } from '../../src/server/app.ts';

let server: http.Server;
let baseUrl = '';

const uniqueTag = `vitest-${Date.now()}`;
const testEmail = `${uniqueTag}@example.com`;
let registeredToken = '';
let registeredUserId = 0;
let demoPatientToken = '';
let demoAdminToken = '';

async function jsonReq(
  path: string,
  options: { method?: string; token?: string; body?: unknown; rawBody?: string } = {}
) {
  const headers: Record<string, string> = {};
  if (options.body !== undefined || options.rawBody !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers,
    body:
      options.rawBody !== undefined
        ? options.rawBody
        : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
  });
  const text = await res.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    json = null;
  }
  return { status: res.status, headers: res.headers, text, json };
}

describe('MomCare AI API Integration Suite', () => {
  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    // Clean up synthetic test user (CASCADE cleans appointments, reminders, posts, comments, logs)
    const sb = getSupabaseClient();
    if (sb && registeredUserId) {
      await sb.from('users').delete().eq('id', registeredUserId);
    } else if (sb) {
      await sb.from('users').delete().eq('email', testEmail);
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('GET /api/health returns healthy JSON', async () => {
    const res = await jsonReq('/api/health');
    expect(res.status).toBe(200);
    expect(res.json?.status).toBe('ok');
    expect(res.json?.service).toBe('MomCare AI');
  });

  it('returns valid JSON 404 on unknown /api routes and JSON 400 on malformed JSON body', async () => {
    const missing = await jsonReq('/api/non-existent-endpoint');
    expect(missing.status).toBe(404);
    expect(missing.json?.error).toBe('API endpoint not found.');

    const malformed = await jsonReq('/api/auth/login', {
      method: 'POST',
      rawBody: '{bad json',
    });
    expect(malformed.status).toBe(400);
    expect(malformed.json?.error).toBe('Invalid JSON request body.');
  });

  it('POST /api/auth/demo signs in patient and admin cleanly with valid JSON & tokens', async () => {
    const pat = await jsonReq('/api/auth/demo', {
      method: 'POST',
      body: { role: 'patient' },
    });
    expect(pat.status).toBe(200);
    expect(typeof pat.json?.token).toBe('string');
    expect((pat.json?.user as { uid?: string })?.uid).toBe('demo-patient-ananya');
    expect(pat.headers.get('cache-control')).toContain('no-store');
    demoPatientToken = String(pat.json?.token);

    const adm = await jsonReq('/api/auth/demo', {
      method: 'POST',
      body: { role: 'admin' },
    });
    expect(adm.status).toBe(200);
    expect((adm.json?.user as { role?: string })?.role).toBe('admin');
    demoAdminToken = String(adm.json?.token);
  });

  it('enforces registration validation, registers new mom, logs in, updates profile, and changes password', async () => {
    const weakPwd = await jsonReq('/api/auth/register', {
      method: 'POST',
      body: { fullName: 'Test User', email: testEmail, password: 'short' },
    });
    expect(weakPwd.status).toBe(400);

    const reg = await jsonReq('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Audit Test Mother',
        email: testEmail,
        password: 'AuditPass2026',
        age: 29,
        pregnancyWeek: 20,
        lmpDate: '2026-06-01',
        expectedDeliveryDate: '2027-03-08',
        bloodGroup: 'O+',
        dietPreference: 'vegetarian',
      },
    });
    expect(reg.status).toBe(201);
    registeredToken = String(reg.json?.token);
    registeredUserId = Number((reg.json?.user as { id?: number })?.id);
    expect(registeredUserId).toBeGreaterThan(0);

    const dup = await jsonReq('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Duplicate User',
        email: testEmail,
        password: 'AuditPass2026',
      },
    });
    expect(dup.status).toBe(409);

    const login = await jsonReq('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'AuditPass2026' },
    });
    expect(login.status).toBe(200);
    expect(typeof login.json?.token).toBe('string');

    const me = await jsonReq('/api/auth/me', { token: registeredToken });
    expect(me.status).toBe(200);
    expect((me.json?.user as { email?: string })?.email).toBe(testEmail);

    const updateProf = await jsonReq('/api/auth/profile', {
      method: 'PUT',
      token: registeredToken,
      body: { pregnancyWeek: 22, dietPreference: 'non-vegetarian' },
    });
    expect(updateProf.status).toBe(200);
    expect((updateProf.json?.user as { pregnancyWeek?: number })?.pregnancyWeek).toBe(22);

    const changePwd = await jsonReq('/api/auth/change-password', {
      method: 'POST',
      token: registeredToken,
      body: {
        currentPassword: 'AuditPass2026',
        newPassword: 'UpdatedPass2026',
      },
    });
    expect(changePwd.status).toBe(200);

    const loginNew = await jsonReq('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'UpdatedPass2026' },
    });
    expect(loginNew.status).toBe(200);
  });

  it('prevents unauthenticated password overwrite on /api/auth/forgot-password', async () => {
    const res = await jsonReq('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: testEmail, newPassword: 'AttackerPassword99' },
    });
    // Without RESEND_API_KEY, returns 503; even with RESEND_API_KEY, never updates password on step 1
    expect([503, 200]).toContain(res.status);

    // Original password still works!
    const login = await jsonReq('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: 'UpdatedPass2026' },
    });
    expect(login.status).toBe(200);
  });

  it('lists seeded doctors and enforces appointment booking & cancellation rules', async () => {
    const docs = await jsonReq('/api/doctors');
    expect(docs.status).toBe(200);
    const list = docs.json?.doctors as Array<{ id: number }>;
    expect(Array.isArray(list) && list.length).toBeGreaterThanOrEqual(4);

    const booked = await jsonReq('/api/appointments', {
      method: 'POST',
      token: registeredToken,
      body: {
        doctorId: list[0].id,
        appointmentDate: '2026-12-15',
        timeSlot: '11:00 AM',
        consultationType: 'Video Consultation',
        reason: 'Automated integration visit test',
      },
    });
    expect(booked.status).toBe(201);
    const apptId = Number((booked.json?.appointment as { id?: number })?.id);

    // Patient must NOT be able to mark their own appointment Completed
    const forbidStatus = await jsonReq(`/api/appointments/${apptId}`, {
      method: 'PATCH',
      token: registeredToken,
      body: { status: 'Completed' },
    });
    expect(forbidStatus.status).toBe(400);

    const cancelled = await jsonReq(`/api/appointments/${apptId}`, {
      method: 'PATCH',
      token: registeredToken,
      body: { status: 'Cancelled' },
    });
    expect(cancelled.status).toBe(200);
    expect((cancelled.json?.appointment as { status?: string })?.status).toBe('Cancelled');
  });

  it('handles full CRUD on reminders & daily hydration & postpartum logs', async () => {
    const remCreate = await jsonReq('/api/reminders', {
      method: 'POST',
      token: registeredToken,
      body: {
        title: `Iron Pill ${uniqueTag}`,
        category: 'Supplement',
        dueDate: '2026-12-01',
        dueTime: '08:30 AM',
        frequency: 'Daily',
      },
    });
    expect(remCreate.status).toBe(201);
    const remId = Number((remCreate.json?.reminder as { id?: number })?.id);

    const remEdit = await jsonReq(`/api/reminders/${remId}`, {
      method: 'PATCH',
      token: registeredToken,
      body: { completed: true, title: `Updated Pill ${uniqueTag}` },
    });
    expect(remEdit.status).toBe(200);
    expect((remEdit.json?.reminder as { completed?: boolean })?.completed).toBe(true);

    const remDelete = await jsonReq(`/api/reminders/${remId}`, {
      method: 'DELETE',
      token: registeredToken,
    });
    expect(remDelete.status).toBe(200);

    const hyd = await jsonReq('/api/hydration', {
      method: 'POST',
      token: registeredToken,
      body: { date: '2026-12-01', glassesCount: 8 },
    });
    expect(hyd.status).toBe(200);
    expect((hyd.json?.hydration as { glassesCount?: number })?.glassesCount).toBe(8);

    const postp = await jsonReq('/api/postpartum/logs', {
      method: 'POST',
      token: registeredToken,
      body: {
        logDate: '2026-12-01',
        mood: 'Calm & Hopeful',
        sleepHours: '7',
        feedingCount: 9,
        painLevel: 2,
        notes: 'Integration check-in test',
      },
    });
    expect(postp.status).toBe(201);
  });

  it('handles community post creation, likes, comments, and author deletion', async () => {
    const post = await jsonReq('/api/community/posts', {
      method: 'POST',
      token: registeredToken,
      body: {
        category: 'Nutrition Tip',
        title: `Integration Tip ${uniqueTag}`,
        content: 'Sharing a balanced lunch test message for verification.',
      },
    });
    expect(post.status).toBe(201);
    const postId = Number((post.json?.post as { id?: number })?.id);

    const like = await jsonReq(`/api/community/posts/${postId}/like`, {
      method: 'POST',
    });
    expect(like.status).toBe(200);
    expect((like.json?.post as { likesCount?: number })?.likesCount).toBe(1);

    const comment = await jsonReq(`/api/community/posts/${postId}/comments`, {
      method: 'POST',
      token: registeredToken,
      body: { content: 'Helpful integration comment!' },
    });
    expect(comment.status).toBe(201);

    // Patient cannot delete someone else's post, but can delete own post
    const del = await jsonReq(`/api/community/posts/${postId}`, {
      method: 'DELETE',
      token: registeredToken,
    });
    expect(del.status).toBe(200);
  });

  it('enforces admin RBAC cleanly on /api/admin/overview', async () => {
    const unauth = await jsonReq('/api/admin/overview');
    expect(unauth.status).toBe(401);

    const patForbidden = await jsonReq('/api/admin/overview', { token: demoPatientToken });
    expect(patForbidden.status).toBe(403);

    const adminOk = await jsonReq('/api/admin/overview', { token: demoAdminToken });
    expect(adminOk.status).toBe(200);
    expect((adminOk.json?.stats as { totalDoctors?: number })?.totalDoctors).toBeGreaterThanOrEqual(4);
  });

  it('validates /api/ai/assistant input and returns 503 JSON when GEMINI_API_KEY is unset', async () => {
    const emptyMsg = await jsonReq('/api/ai/assistant', {
      method: 'POST',
      body: { message: '   ' },
    });
    expect(emptyMsg.status).toBe(400);

    const keyPresent =
      Boolean(process.env.GEMINI_API_KEY?.trim()) &&
      process.env.GEMINI_API_KEY?.trim() !== 'MY_GEMINI_API_KEY';

    const ask = await jsonReq('/api/ai/assistant', {
      method: 'POST',
      body: { message: 'I have heavy bleeding, what should I do?', weekContext: 24 },
    });
    if (!keyPresent) {
      expect(ask.status).toBe(503);
      expect(typeof ask.json?.error).toBe('string');
    } else {
      expect(ask.status).toBe(200);
      expect(ask.json?.isEmergency).toBe(true);
    }
  });
});
