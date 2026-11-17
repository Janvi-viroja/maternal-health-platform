import { and, desc, eq } from 'drizzle-orm';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  throwSupabaseError,
} from '../lib/supabase.ts';
import { db } from './index.ts';
import {
  appointments,
  communityComments,
  communityPosts,
  doctors,
  hydrationLogs,
  postpartumLogs,
  reminders,
  users,
} from './schema.ts';

function sanitizeUser<T extends { passwordHash?: string | null }>(user: T) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapUserRow(r: any) {
  return {
    id: r.id,
    uid: r.uid,
    email: r.email,
    passwordHash: r.password_hash ?? null,
    role: r.role,
    fullName: r.full_name,
    age: r.age ?? null,
    pregnancyWeek: r.pregnancy_week ?? null,
    lmpDate: r.lmp_date ?? null,
    expectedDeliveryDate: r.expected_delivery_date ?? null,
    bloodGroup: r.blood_group ?? null,
    medicalHistory: r.medical_history ?? null,
    dietPreference: r.diet_preference || 'vegetarian',
    isActive: r.is_active ?? true,
    createdAt: r.created_at ? new Date(r.created_at) : null,
  };
}

function mapDoctorRow(r: any) {
  return {
    id: r.id,
    name: r.name,
    specialization: r.specialization,
    qualification: r.qualification,
    experienceYears: r.experience_years,
    hospital: r.hospital,
    consultationFee: r.consultation_fee,
    rating: r.rating,
    languages: r.languages,
    bio: r.bio,
    imageUrl: r.image_url,
    availableSlots: r.available_slots,
    isAvailable: r.is_available,
    createdAt: r.created_at ? new Date(r.created_at) : null,
  };
}

function mapReminderRow(r: any) {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    category: r.category,
    dueDate: r.due_date,
    dueTime: r.due_time,
    frequency: r.frequency,
    notes: r.notes ?? null,
    completed: r.completed,
    createdAt: r.created_at ? new Date(r.created_at) : null,
  };
}

function mapPostRow(r: any) {
  return {
    id: r.id,
    userId: r.user_id,
    authorName: r.author_name,
    authorWeek: r.author_week ?? null,
    category: r.category,
    title: r.title,
    content: r.content,
    likesCount: r.likes_count ?? 0,
    createdAt: r.created_at ? new Date(r.created_at) : null,
  };
}

function mapCommentRow(r: any) {
  return {
    id: r.id,
    postId: r.post_id,
    userId: r.user_id,
    authorName: r.author_name,
    content: r.content,
    createdAt: r.created_at ? new Date(r.created_at) : null,
  };
}

function mapPostpartumRow(r: any) {
  return {
    id: r.id,
    userId: r.user_id,
    logDate: r.log_date,
    mood: r.mood,
    sleepHours: r.sleep_hours,
    feedingCount: r.feeding_count,
    painLevel: r.pain_level,
    notes: r.notes ?? null,
    createdAt: r.created_at ? new Date(r.created_at) : null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export class DuplicateEmailError extends Error {
  constructor(message = 'An account with this email already exists.') {
    super(message);
    this.name = 'DuplicateEmailError';
  }
}

export function slugifyNameForUid(fullName: string): string {
  const cleaned = fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'mom';
}

export async function generateUniqueUidForName(fullName: string): Promise<string> {
  const base = slugifyNameForUid(fullName);
  let candidate = base;
  let suffix = 2;
  while (await getUserByUid(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

let cachedUserIdIsText: { value: boolean; checkedAt: number } | null = null;

async function isSupabaseUserIdText(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const now = Date.now();
  if (cachedUserIdIsText && now - cachedUserIdIsText.checkedAt < 15000) {
    return cachedUserIdIsText.value;
  }

  const sb = getSupabaseClient()!;
  const { error } = await sb
    .from('reminders')
    .select('id')
    .eq('user_id', '__type_check__')
    .limit(1);

  const isText = !error;
  cachedUserIdIsText = { value: isText, checkedAt: now };
  return isText;
}

async function resolveSupabaseUserKey(userId: number, userUid?: string): Promise<number | string> {
  if (!(await isSupabaseUserIdText())) {
    return userId;
  }
  if (userUid) return userUid;
  const sb = getSupabaseClient()!;
  const { data } = await sb.from('users').select('uid').eq('id', userId).limit(1).maybeSingle();
  return data?.uid ?? String(userId);
}

let supabaseSeeded = false;
let supabaseSeedPromise: Promise<void> | null = null;

export async function ensureSupabaseSeeded(): Promise<void> {
  if (!isSupabaseConfigured() || supabaseSeeded) return;
  if (supabaseSeedPromise) return supabaseSeedPromise;

  supabaseSeedPromise = (async () => {
    const sb = getSupabaseClient()!;
    const { data: existingDoctors, error: docCheckErr } = await sb
      .from('doctors')
      .select('id')
      .limit(1);
    if (docCheckErr) {
      throwSupabaseError('ensureSupabaseSeeded:doctors', 'Unable to verify Supabase doctors table.', docCheckErr);
    }

    if (existingDoctors && existingDoctors.length > 0) {
      supabaseSeeded = true;
      return;
    }

    const { error: userSeedErr } = await sb.from('users').upsert(
      [
        {
          uid: 'demo-patient-ananya',
          email: 'ananya.mehta@momcare.ai',
          role: 'patient',
          full_name: 'Ananya Mehta',
          age: 29,
          pregnancy_week: 24,
          lmp_date: '2026-06-01',
          expected_delivery_date: '2027-03-08',
          blood_group: 'O+',
          medical_history:
            'Mild low iron at week 16; taking doctor-prescribed iron and folic acid.',
          diet_preference: 'vegetarian',
          is_active: true,
        },
        {
          uid: 'demo-patient-priya',
          email: 'priya.kapoor@momcare.ai',
          role: 'patient',
          full_name: 'Priya Kapoor',
          age: 32,
          pregnancy_week: 34,
          lmp_date: '2026-03-23',
          expected_delivery_date: '2026-12-28',
          blood_group: 'B+',
          medical_history: 'No chronic conditions. Healthy second pregnancy.',
          diet_preference: 'non-vegetarian',
          is_active: true,
        },
        {
          uid: 'demo-admin-kavya',
          email: 'admin@momcare.ai',
          role: 'admin',
          full_name: 'Dr. Kavya Menon (Admin)',
          age: 36,
          blood_group: 'A+',
          medical_history: 'Site Care Lead',
          diet_preference: 'vegetarian',
          is_active: true,
        },
      ],
      { onConflict: 'uid', ignoreDuplicates: true }
    );
    if (userSeedErr) {
      throwSupabaseError('ensureSupabaseSeeded:users', 'Unable to seed demo users in Supabase.', userSeedErr);
    }

    const { data: insertedDoctors, error: docSeedErr } = await sb
      .from('doctors')
      .insert([
        {
          name: 'Dr. Ananya Sharma',
          specialization: 'Pregnancy & Women’s Health Doctor',
          qualification: 'MBBS, MD (OB-GYN), FICOG',
          experience_years: 14,
          hospital: 'Lotus Women & Maternity Care',
          consultation_fee: 950,
          rating: '4.9',
          languages: 'English, Hindi',
          bio: 'Helps mothers with gentle birth planning, blood sugar care during pregnancy, and week-by-week checkups.',
          image_url: '/src/assets/images/doctor_female_obgyn_1794900597156.jpg',
          available_slots: '["09:30 AM","11:00 AM","02:30 PM","05:00 PM"]',
          is_available: true,
        },
        {
          name: 'Dr. Daniel Brooks',
          specialization: 'Baby Growth & Newborn Doctor',
          qualification: 'MD, FACOG, Fellowship in MFM',
          experience_years: 12,
          hospital: 'Bloom Perinatal Institute',
          consultation_fee: 1200,
          rating: '4.9',
          languages: 'English',
          bio: 'Focuses on ultrasound baby scans, twin pregnancies, and safe newborn care right after birth.',
          image_url: '/src/assets/images/doctor_male_pediatrician_1794900597643.jpg',
          available_slots: '["10:00 AM","12:30 PM","03:00 PM","06:00 PM"]',
          is_available: true,
        },
        {
          name: 'Dr. Meera Deshmukh',
          specialization: 'Breastfeeding & After-Birth Care Doctor',
          qualification: 'MBBS, DGO, IBCLC',
          experience_years: 10,
          hospital: 'Nurturing Roots Maternity Clinic',
          consultation_fee: 800,
          rating: '4.8',
          languages: 'English, Hindi, Marathi',
          bio: 'Helps new mothers heal after birth, feed baby comfortably, and feel emotionally supported.',
          image_url: 'initials:MD',
          available_slots: '["09:00 AM","11:30 AM","04:00 PM","05:30 PM"]',
          is_available: true,
        },
        {
          name: 'Dr. Rohan Kulkarni',
          specialization: 'Pregnancy Food & Thyroid Doctor',
          qualification: 'MBBS, MD (Internal Medicine), CDE',
          experience_years: 11,
          hospital: 'Aura Maternal Wellness Center',
          consultation_fee: 900,
          rating: '4.8',
          languages: 'English, Hindi, Kannada',
          bio: 'Guides mothers on healthy Indian meal plans, iron levels, thyroid balance, and safe blood sugar.',
          image_url: 'initials:RK',
          available_slots: '["10:30 AM","01:00 PM","03:30 PM","06:30 PM"]',
          is_available: true,
        },
      ])
      .select('*');
    if (docSeedErr) {
      throwSupabaseError('ensureSupabaseSeeded:insertDoctors', 'Unable to seed doctors in Supabase.', docSeedErr);
    }

    const { data: demoUsers } = await sb
      .from('users')
      .select('id, uid')
      .in('uid', ['demo-patient-ananya', 'demo-patient-priya']);
    const ananyaUser = demoUsers?.find((u) => u.uid === 'demo-patient-ananya');
    const priyaUser = demoUsers?.find((u) => u.uid === 'demo-patient-priya');
    const firstDoctorId = insertedDoctors?.[0]?.id;

    const useTextKey = await isSupabaseUserIdText();
    const ananyaKey = ananyaUser ? (useTextKey ? ananyaUser.uid : ananyaUser.id) : null;
    const priyaKey = priyaUser ? (useTextKey ? priyaUser.uid : priyaUser.id) : null;

    if (ananyaKey && firstDoctorId) {
      await sb.from('appointments').insert({
        user_id: ananyaKey,
        doctor_id: firstDoctorId,
        appointment_date: '2026-11-22',
        time_slot: '11:00 AM',
        consultation_type: 'Video Consultation',
        reason: 'Week 24 Sugar Test & Baby Movement Check',
        status: 'Confirmed',
        notes: 'Bring recent hemoglobin and fasting blood sugar reports.',
      });
    }

    if (ananyaKey) {
      await sb.from('reminders').insert([
        {
          user_id: ananyaKey,
          title: 'Folic Acid & Iron Tablet',
          category: 'Supplement',
          due_date: '2026-11-17',
          due_time: '08:30 AM',
          frequency: 'Daily',
          notes: 'Take with orange or lemon water; skip tea or coffee for 1 hour.',
          completed: false,
        },
        {
          user_id: ananyaKey,
          title: 'Tdap Vaccine Window',
          category: 'Vaccination',
          due_date: '2026-12-10',
          due_time: '10:30 AM',
          frequency: 'Once',
          notes: 'Usually given between weeks 27 and 36 to help protect your newborn.',
          completed: false,
        },
        {
          user_id: ananyaKey,
          title: 'Sugar Screening Checkup',
          category: 'Prenatal Checkup',
          due_date: '2026-11-24',
          due_time: '09:00 AM',
          frequency: 'Once',
          notes: 'Do not eat for 8–10 hours overnight before your morning clinic test.',
          completed: false,
        },
        {
          user_id: ananyaKey,
          title: 'Afternoon Water Check-in',
          category: 'Hydration',
          due_date: '2026-11-17',
          due_time: '03:00 PM',
          frequency: 'Daily',
          notes: 'Drink 8–10 glasses of water, coconut water, or plain chaas.',
          completed: true,
        },
      ]);
    }

    if (ananyaKey && priyaKey) {
      await sb.from('community_posts').insert([
        {
          user_id: ananyaKey,
          author_name: 'Ananya Mehta',
          author_week: 24,
          category: 'Nutrition Tip',
          title: 'Evening snacks that helped my energy in Week 24',
          content:
            'Roasted makhana, soaked almonds, and pomegranate with a drop of lemon really helped my afternoon tiredness. Has anyone else tried ragi laddoos with jaggery?',
          likes_count: 14,
        },
        {
          user_id: priyaKey,
          author_name: 'Priya Kapoor',
          author_week: 34,
          category: 'Experience',
          title: 'Easy pillow trick for better sleep in Months 7–9',
          content:
            'Putting a firm pillow behind my back while sleeping on my left side kept me comfortable all night and stopped leg swelling.',
          likes_count: 21,
        },
        {
          user_id: ananyaKey,
          author_name: 'Ananya Mehta',
          author_week: 24,
          category: 'Question',
          title: 'Questions for my 24-week sugar test visit',
          content:
            'I have my sugar test next week. What questions did you ask your doctor about meal timing and results?',
          likes_count: 9,
        },
      ]);
    }

    supabaseSeeded = true;
  })();

  try {
    await supabaseSeedPromise;
  } finally {
    supabaseSeedPromise = null;
  }
}

export async function getUserByUid(uid: string) {
  if (isSupabaseConfigured()) {
    await ensureSupabaseSeeded();
    const sb = getSupabaseClient()!;
    const { data, error } = await sb
      .from('users')
      .select('*')
      .eq('uid', uid)
      .limit(1)
      .maybeSingle();
    if (error) {
      throwSupabaseError('getUserByUid', 'Unable to load user profile.', error);
    }
    return data ? sanitizeUser(mapUserRow(data)) : null;
  }

  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] ? sanitizeUser(rows[0]) : null;
  } catch (error) {
    console.error('Database query failed (getUserByUid):', error);
    throw new Error('Unable to load user profile.', { cause: error });
  }
}

export async function getUserByEmailWithSecret(email: string) {
  const normalized = email.trim().toLowerCase();
  if (isSupabaseConfigured()) {
    await ensureSupabaseSeeded();
    const sb = getSupabaseClient()!;
    const { data, error } = await sb
      .from('users')
      .select('*')
      .eq('email', normalized)
      .limit(1)
      .maybeSingle();
    if (error) {
      throwSupabaseError('getUserByEmailWithSecret', 'Unable to verify account credentials.', error);
    }
    return data ? mapUserRow(data) : null;
  }

  try {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, normalized))
      .limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed (getUserByEmailWithSecret):', error);
    throw new Error('Unable to verify account credentials.', { cause: error });
  }
}

export async function getOrCreateFirebaseUser(
  uid: string,
  email: string,
  fullName: string,
  emailVerified = false
) {
  const normalizedEmail = email.trim().toLowerCase();
  if (isSupabaseConfigured()) {
    await ensureSupabaseSeeded();
    const sb = getSupabaseClient()!;
    const { data: existing, error: fetchErr } = await sb
      .from('users')
      .select('*')
      .eq('uid', uid)
      .limit(1)
      .maybeSingle();
    if (fetchErr) {
      throwSupabaseError('getOrCreateFirebaseUser:fetch', 'Unable to synchronize user account.', fetchErr);
    }
    if (existing) return sanitizeUser(mapUserRow(existing));

    const { data: emailMatch, error: emailErr } = await sb
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .limit(1)
      .maybeSingle();
    if (emailErr) {
      throwSupabaseError('getOrCreateFirebaseUser:email', 'Unable to synchronize user account.', emailErr);
    }

    if (emailMatch) {
      if (!emailVerified) {
        throw new Error('Please verify your email address before linking your Google account.');
      }
      const { data: linked, error: linkErr } = await sb
        .from('users')
        .update({ uid })
        .eq('id', emailMatch.id)
        .select('*')
        .single();
      if (linkErr || !linked) {
        throwSupabaseError('getOrCreateFirebaseUser:link', 'Unable to synchronize user account.', linkErr);
      }
      return sanitizeUser(mapUserRow(linked));
    }

    const { data: inserted, error: insertErr } = await sb
      .from('users')
      .insert({
        uid,
        email: normalizedEmail,
        full_name: fullName,
        role: 'patient',
        pregnancy_week: 16,
        diet_preference: 'vegetarian',
      })
      .select('*')
      .single();
    if (insertErr || !inserted) {
      throwSupabaseError('getOrCreateFirebaseUser:insert', 'Unable to synchronize user account.', insertErr);
    }
    return sanitizeUser(mapUserRow(inserted));
  }

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1);
    if (existing[0]) {
      return sanitizeUser(existing[0]);
    }
    const byEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    if (byEmail[0]) {
      if (!emailVerified) {
        throw new Error('Please verify your email address before linking your Google account.');
      }
      const linked = await db
        .update(users)
        .set({ uid })
        .where(eq(users.id, byEmail[0].id))
        .returning();
      return sanitizeUser(linked[0]);
    }
    const inserted = await db
      .insert(users)
      .values({
        uid,
        email: normalizedEmail,
        fullName,
        role: 'patient',
        pregnancyWeek: 16,
        dietPreference: 'vegetarian',
      })
      .returning();
    return sanitizeUser(inserted[0]);
  } catch (error) {
    console.error('Database query failed (getOrCreateFirebaseUser):', error);
    throw error instanceof Error
      ? error
      : new Error('Unable to synchronize user account.', { cause: error });
  }
}

export async function createLocalUser(data: {
  uid: string;
  email: string;
  passwordHash: string;
  fullName: string;
  age?: number | null;
  pregnancyWeek?: number | null;
  lmpDate?: string | null;
  expectedDeliveryDate?: string | null;
  bloodGroup?: string | null;
  medicalHistory?: string | null;
  dietPreference?: string;
}) {
  const normalizedEmail = data.email.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    await ensureSupabaseSeeded();
    const sb = getSupabaseClient()!;
    const { data: inserted, error } = await sb
      .from('users')
      .insert({
        uid: data.uid,
        email: normalizedEmail,
        password_hash: data.passwordHash,
        role: 'patient',
        full_name: data.fullName,
        age: data.age ?? null,
        pregnancy_week: data.pregnancyWeek ?? null,
        lmp_date: data.lmpDate ?? null,
        expected_delivery_date: data.expectedDeliveryDate ?? null,
        blood_group: data.bloodGroup ?? null,
        medical_history: data.medicalHistory ?? null,
        diet_preference: data.dietPreference || 'vegetarian',
        is_active: true,
      })
      .select('*')
      .single();
    if (error?.code === '23505') {
      throw new DuplicateEmailError(
        'An account with this email already exists. Please sign in instead.'
      );
    }
    if (error || !inserted) {
      throwSupabaseError('createLocalUser', 'Unable to register account.', error);
    }
    return sanitizeUser(mapUserRow(inserted));
  }

  try {
    const inserted = await db
      .insert(users)
      .values({
        uid: data.uid,
        email: normalizedEmail,
        passwordHash: data.passwordHash,
        role: 'patient',
        fullName: data.fullName,
        age: data.age ?? null,
        pregnancyWeek: data.pregnancyWeek ?? null,
        lmpDate: data.lmpDate ?? null,
        expectedDeliveryDate: data.expectedDeliveryDate ?? null,
        bloodGroup: data.bloodGroup ?? null,
        medicalHistory: data.medicalHistory ?? null,
        dietPreference: data.dietPreference || 'vegetarian',
        isActive: true,
      })
      .returning();
    return sanitizeUser(inserted[0]);
  } catch (error: unknown) {
    const pgCode = (error as { code?: string })?.code;
    if (pgCode === '23505') {
      throw new DuplicateEmailError(
        'An account with this email already exists. Please sign in instead.'
      );
    }
    console.error('Database query failed (createLocalUser):', error);
    throw new Error('Unable to register account.', { cause: error });
  }
}

export async function updateUserPasswordByEmail(
  email: string,
  newPasswordHash: string
) {
  const normalizedEmail = email.trim().toLowerCase();
  if (isSupabaseConfigured()) {
    await ensureSupabaseSeeded();
    const sb = getSupabaseClient()!;
    const { data, error } = await sb
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('email', normalizedEmail)
      .select('*')
      .maybeSingle();
    if (error) {
      throwSupabaseError('updateUserPasswordByEmail', 'Unable to reset password.', error);
    }
    return data ? sanitizeUser(mapUserRow(data)) : null;
  }

  try {
    const updated = await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.email, normalizedEmail))
      .returning();
    return updated[0] ? sanitizeUser(updated[0]) : null;
  } catch (error) {
    console.error('Database query failed (updateUserPasswordByEmail):', error);
    throw new Error('Unable to reset password.', { cause: error });
  }
}

export async function updateUserProfile(
  userId: number,
  updates: {
    fullName?: string;
    age?: number | null;
    pregnancyWeek?: number | null;
    lmpDate?: string | null;
    expectedDeliveryDate?: string | null;
    bloodGroup?: string | null;
    medicalHistory?: string | null;
    dietPreference?: string;
  }
) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const payload: Record<string, unknown> = {};
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.age !== undefined) payload.age = updates.age;
    if (updates.pregnancyWeek !== undefined)
      payload.pregnancy_week = updates.pregnancyWeek;
    if (updates.lmpDate !== undefined) payload.lmp_date = updates.lmpDate;
    if (updates.expectedDeliveryDate !== undefined)
      payload.expected_delivery_date = updates.expectedDeliveryDate;
    if (updates.bloodGroup !== undefined) payload.blood_group = updates.bloodGroup;
    if (updates.medicalHistory !== undefined)
      payload.medical_history = updates.medicalHistory;
    if (updates.dietPreference !== undefined)
      payload.diet_preference = updates.dietPreference;

    const { data, error } = await sb
      .from('users')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .maybeSingle();
    if (error) {
      throwSupabaseError('updateUserProfile', 'Unable to update patient profile.', error);
    }
    return data ? sanitizeUser(mapUserRow(data)) : null;
  }

  try {
    const updated = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return updated[0] ? sanitizeUser(updated[0]) : null;
  } catch (error) {
    console.error('Database query failed (updateUserProfile):', error);
    throw new Error('Unable to update patient profile.', { cause: error });
  }
}

export async function listDoctors(includeUnavailable = false) {
  if (isSupabaseConfigured()) {
    await ensureSupabaseSeeded();
    const sb = getSupabaseClient()!;
    let query = sb.from('doctors').select('*').order('id', { ascending: true });
    if (!includeUnavailable) {
      query = query.eq('is_available', true);
    }
    const { data, error } = await query;
    if (error) {
      throwSupabaseError('listDoctors', 'Unable to load doctors.', error);
    }
    return (data || []).map(mapDoctorRow);
  }

  try {
    if (includeUnavailable) {
      return await db.select().from(doctors).orderBy(doctors.id);
    }
    return await db
      .select()
      .from(doctors)
      .where(eq(doctors.isAvailable, true))
      .orderBy(doctors.id);
  } catch (error) {
    console.error('Database query failed (listDoctors):', error);
    throw new Error('Unable to load doctors.', { cause: error });
  }
}

export async function getDoctorById(doctorId: number) {
  if (isSupabaseConfigured()) {
    await ensureSupabaseSeeded();
    const sb = getSupabaseClient()!;
    const { data, error } = await sb
      .from('doctors')
      .select('*')
      .eq('id', doctorId)
      .limit(1)
      .maybeSingle();
    if (error) {
      throwSupabaseError('getDoctorById', 'Unable to verify doctor.', error);
    }
    return data ? mapDoctorRow(data) : null;
  }

  try {
    const rows = await db
      .select()
      .from(doctors)
      .where(eq(doctors.id, doctorId))
      .limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed (getDoctorById):', error);
    throw new Error('Unable to verify doctor.', { cause: error });
  }
}

export async function createDoctorRecord(data: {
  name: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  hospital: string;
  consultationFee: number;
  rating: string;
  languages: string;
  bio: string;
  imageUrl: string;
  availableSlots: string;
}) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const { data: inserted, error } = await sb
      .from('doctors')
      .insert({
        name: data.name,
        specialization: data.specialization,
        qualification: data.qualification,
        experience_years: data.experienceYears,
        hospital: data.hospital,
        consultation_fee: data.consultationFee,
        rating: data.rating,
        languages: data.languages,
        bio: data.bio,
        image_url: data.imageUrl,
        available_slots: data.availableSlots,
      })
      .select('*')
      .single();
    if (error || !inserted) {
      throwSupabaseError('createDoctorRecord', 'Unable to add doctor.', error);
    }
    return mapDoctorRow(inserted);
  }

  try {
    const inserted = await db.insert(doctors).values(data).returning();
    return inserted[0];
  } catch (error) {
    console.error('Database query failed (createDoctorRecord):', error);
    throw new Error('Unable to add doctor.', { cause: error });
  }
}

export async function toggleDoctorAvailability(doctorId: number, isAvailable: boolean) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb
      .from('doctors')
      .update({ is_available: isAvailable })
      .eq('id', doctorId)
      .select('*')
      .maybeSingle();
    if (error) {
      throwSupabaseError('toggleDoctorAvailability', 'Unable to update doctor status.', error);
    }
    return data ? mapDoctorRow(data) : null;
  }

  try {
    const updated = await db
      .update(doctors)
      .set({ isAvailable })
      .where(eq(doctors.id, doctorId))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('Database query failed (toggleDoctorAvailability):', error);
    throw new Error('Unable to update doctor status.', { cause: error });
  }
}

export async function listUserAppointments(userId: number, userUid?: string) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const userKey = await resolveSupabaseUserKey(userId, userUid);
    const { data, error } = await sb
      .from('appointments')
      .select('*, doctors(name, specialization, hospital, image_url)')
      .eq('user_id', userKey)
      .order('created_at', { ascending: false });
    if (error) {
      throwSupabaseError('listUserAppointments', 'Unable to load appointments.', error);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      doctorId: r.doctor_id,
      appointmentDate: r.appointment_date,
      timeSlot: r.time_slot,
      consultationType: r.consultation_type,
      reason: r.reason,
      status: r.status,
      notes: r.notes ?? null,
      createdAt: r.created_at ? new Date(r.created_at) : null,
      doctorName: r.doctors?.name,
      doctorSpecialization: r.doctors?.specialization,
      doctorHospital: r.doctors?.hospital,
      doctorImageUrl: r.doctors?.image_url,
    }));
  }

  try {
    const rows = await db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        doctorId: appointments.doctorId,
        appointmentDate: appointments.appointmentDate,
        timeSlot: appointments.timeSlot,
        consultationType: appointments.consultationType,
        reason: appointments.reason,
        status: appointments.status,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        doctorName: doctors.name,
        doctorSpecialization: doctors.specialization,
        doctorHospital: doctors.hospital,
        doctorImageUrl: doctors.imageUrl,
      })
      .from(appointments)
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(eq(appointments.userId, userId))
      .orderBy(desc(appointments.createdAt));
    return rows;
  } catch (error) {
    console.error('Database query failed (listUserAppointments):', error);
    throw new Error('Unable to load appointments.', { cause: error });
  }
}

export async function createAppointmentRecord(data: {
  userId: number;
  userUid?: string;
  doctorId: number;
  appointmentDate: string;
  timeSlot: string;
  consultationType: string;
  reason: string;
  notes?: string;
}) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const userKey = await resolveSupabaseUserKey(data.userId, data.userUid);
    const { data: inserted, error } = await sb
      .from('appointments')
      .insert({
        user_id: userKey,
        doctor_id: data.doctorId,
        appointment_date: data.appointmentDate,
        time_slot: data.timeSlot,
        consultation_type: data.consultationType,
        reason: data.reason,
        notes: data.notes ?? null,
        status: 'Confirmed',
      })
      .select('*')
      .single();
    if (error || !inserted) {
      throwSupabaseError('createAppointmentRecord', 'Unable to book appointment.', error);
    }
    return {
      id: inserted.id,
      userId: inserted.user_id,
      doctorId: inserted.doctor_id,
      appointmentDate: inserted.appointment_date,
      timeSlot: inserted.time_slot,
      consultationType: inserted.consultation_type,
      reason: inserted.reason,
      status: inserted.status,
      notes: inserted.notes ?? null,
      createdAt: inserted.created_at ? new Date(inserted.created_at) : null,
    };
  }

  try {
    const inserted = await db
      .insert(appointments)
      .values({
        userId: data.userId,
        doctorId: data.doctorId,
        appointmentDate: data.appointmentDate,
        timeSlot: data.timeSlot,
        consultationType: data.consultationType,
        reason: data.reason,
        notes: data.notes ?? null,
        status: 'Confirmed',
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Database query failed (createAppointmentRecord):', error);
    throw new Error('Unable to book appointment.', { cause: error });
  }
}

export async function updateUserAppointmentStatus(
  appointmentId: number,
  userId: number,
  status: string,
  userUid?: string
) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const userKey = await resolveSupabaseUserKey(userId, userUid);
    const { data, error } = await sb
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId)
      .eq('user_id', userKey)
      .select('*')
      .maybeSingle();
    if (error) {
      throwSupabaseError('updateUserAppointmentStatus', 'Unable to update appointment.', error);
    }
    return data
      ? {
          id: data.id,
          userId: data.user_id,
          doctorId: data.doctor_id,
          appointmentDate: data.appointment_date,
          timeSlot: data.time_slot,
          consultationType: data.consultation_type,
          reason: data.reason,
          status: data.status,
          notes: data.notes ?? null,
          createdAt: data.created_at ? new Date(data.created_at) : null,
        }
      : null;
  }

  try {
    const updated = await db
      .update(appointments)
      .set({ status })
      .where(and(eq(appointments.id, appointmentId), eq(appointments.userId, userId)))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('Database query failed (updateUserAppointmentStatus):', error);
    throw new Error('Unable to update appointment.', { cause: error });
  }
}

export async function listUserReminders(userId: number, userUid?: string) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const userKey = await resolveSupabaseUserKey(userId, userUid);
    const { data, error } = await sb
      .from('reminders')
      .select('*')
      .eq('user_id', userKey)
      .order('completed', { ascending: true })
      .order('due_date', { ascending: true });
    if (error) {
      throwSupabaseError('listUserReminders', 'Unable to load reminders.', error);
    }
    return (data || []).map(mapReminderRow);
  }

  try {
    return await db
      .select()
      .from(reminders)
      .where(eq(reminders.userId, userId))
      .orderBy(reminders.completed, reminders.dueDate);
  } catch (error) {
    console.error('Database query failed (listUserReminders):', error);
    throw new Error('Unable to load reminders.', { cause: error });
  }
}

export async function createReminderRecord(data: {
  userId: number;
  userUid?: string;
  title: string;
  category: string;
  dueDate: string;
  dueTime: string;
  frequency: string;
  notes?: string;
}) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const userKey = await resolveSupabaseUserKey(data.userId, data.userUid);
    const { data: inserted, error } = await sb
      .from('reminders')
      .insert({
        user_id: userKey,
        title: data.title,
        category: data.category,
        due_date: data.dueDate,
        due_time: data.dueTime,
        frequency: data.frequency,
        notes: data.notes ?? null,
        completed: false,
      })
      .select('*')
      .single();
    if (error || !inserted) {
      throwSupabaseError('createReminderRecord', 'Unable to save reminder.', error);
    }
    return mapReminderRow(inserted);
  }

  try {
    const inserted = await db
      .insert(reminders)
      .values({
        userId: data.userId,
        title: data.title,
        category: data.category,
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        frequency: data.frequency,
        notes: data.notes ?? null,
        completed: false,
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Database query failed (createReminderRecord):', error);
    throw new Error('Unable to create reminder.', { cause: error });
  }
}

export async function toggleReminderRecord(
  reminderId: number,
  userId: number,
  completed: boolean,
  userUid?: string
) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const userKey = await resolveSupabaseUserKey(userId, userUid);
    const { data, error } = await sb
      .from('reminders')
      .update({ completed })
      .eq('id', reminderId)
      .eq('user_id', userKey)
      .select('*')
      .maybeSingle();
    if (error) {
      throwSupabaseError('toggleReminderRecord', 'Unable to update reminder.', error);
    }
    return data ? mapReminderRow(data) : null;
  }

  try {
    const updated = await db
      .update(reminders)
      .set({ completed })
      .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('Database query failed (toggleReminderRecord):', error);
    throw new Error('Unable to update reminder.', { cause: error });
  }
}

export async function updateReminderRecord(
  reminderId: number,
  userId: number,
  updates: {
    completed?: boolean;
    title?: string;
    category?: string;
    dueDate?: string;
    dueTime?: string;
    frequency?: string;
    notes?: string | null;
  },
  userUid?: string
) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const userKey = await resolveSupabaseUserKey(userId, userUid);
    const payload: Record<string, unknown> = {};
    if (updates.completed !== undefined) payload.completed = updates.completed;
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
    if (updates.dueTime !== undefined) payload.due_time = updates.dueTime;
    if (updates.frequency !== undefined) payload.frequency = updates.frequency;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { data, error } = await sb
      .from('reminders')
      .update(payload)
      .eq('id', reminderId)
      .eq('user_id', userKey)
      .select('*')
      .maybeSingle();
    if (error) {
      throwSupabaseError('updateReminderRecord', 'Unable to update reminder.', error);
    }
    return data ? mapReminderRow(data) : null;
  }

  try {
    const updated = await db
      .update(reminders)
      .set(updates)
      .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('Database query failed (updateReminderRecord):', error);
    throw new Error('Unable to update reminder.', { cause: error });
  }
}

export async function deleteReminderRecord(
  reminderId: number,
  userId: number,
  userUid?: string
) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const userKey = await resolveSupabaseUserKey(userId, userUid);
    const { data, error } = await sb
      .from('reminders')
      .delete()
      .eq('id', reminderId)
      .eq('user_id', userKey)
      .select('*')
      .maybeSingle();
    if (error) {
      throwSupabaseError('deleteReminderRecord', 'Unable to delete reminder.', error);
    }
    return data ? mapReminderRow(data) : null;
  }

  try {
    const deleted = await db
      .delete(reminders)
      .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
      .returning();
    return deleted[0] ?? null;
  } catch (error) {
    console.error('Database query failed (deleteReminderRecord):', error);
    throw new Error('Unable to delete reminder.', { cause: error });
  }
}

export async function deleteCommunityPostByAuthor(
  postId: number,
  userId: number,
  userUid?: string
) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const userKey = await resolveSupabaseUserKey(userId, userUid);
    const { data, error } = await sb
      .from('community_posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userKey)
      .select('*')
      .maybeSingle();
    if (error) {
      throwSupabaseError('deleteCommunityPostByAuthor', 'Unable to delete community post.', error);
    }
    return data ? mapPostRow(data) : null;
  }

  try {
    const deleted = await db
      .delete(communityPosts)
      .where(and(eq(communityPosts.id, postId), eq(communityPosts.userId, userId)))
      .returning();
    return deleted[0] ?? null;
  } catch (error) {
    console.error('Database query failed (deleteCommunityPostByAuthor):', error);
    throw new Error('Unable to delete community post.', { cause: error });
  }
}

export async function listCommunityPostsWithComments() {
  if (isSupabaseConfigured()) {
    await ensureSupabaseSeeded();
    const sb = getSupabaseClient()!;
    const { data: postsData, error: postsErr } = await sb
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (postsErr) {
      throwSupabaseError('listCommunityPostsWithComments', 'Unable to load community posts.', postsErr);
    }
    const { data: commentsData, error: commentsErr } = await sb
      .from('community_comments')
      .select('*')
      .order('created_at', { ascending: true });
    if (commentsErr) {
      throwSupabaseError('listCommunityPostsWithComments:comments', 'Unable to load comments.', commentsErr);
    }
    const mappedComments = (commentsData || []).map(mapCommentRow);
    return (postsData || []).map((p) => {
      const mapped = mapPostRow(p);
      return {
        ...mapped,
        comments: mappedComments.filter((c) => c.postId === mapped.id),
      };
    });
  }

  try {
    const posts = await db
      .select()
      .from(communityPosts)
      .orderBy(desc(communityPosts.createdAt));
    const comments = await db
      .select()
      .from(communityComments)
      .orderBy(communityComments.createdAt);

    return posts.map((post) => ({
      ...post,
      comments: comments.filter((c) => c.postId === post.id),
    }));
  } catch (error) {
    console.error('Database query failed (listCommunityPostsWithComments):', error);
    throw new Error('Unable to load community discussions.', { cause: error });
  }
}

export async function createCommunityPostRecord(data: {
  userId: number;
  userUid?: string;
  authorName: string;
  authorWeek?: number | null;
  category: string;
  title: string;
  content: string;
}) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const userKey = await resolveSupabaseUserKey(data.userId, data.userUid);
    const { data: inserted, error } = await sb
      .from('community_posts')
      .insert({
        user_id: userKey,
        author_name: data.authorName,
        author_week: data.authorWeek ?? null,
        category: data.category,
        title: data.title,
        content: data.content,
        likes_count: 0,
      })
      .select('*')
      .single();
    if (error || !inserted) {
      throwSupabaseError('createCommunityPostRecord', 'Unable to publish community post.', error);
    }
    return { ...mapPostRow(inserted), comments: [] };
  }

  try {
    const inserted = await db
      .insert(communityPosts)
      .values({
        userId: data.userId,
        authorName: data.authorName,
        authorWeek: data.authorWeek ?? null,
        category: data.category,
        title: data.title,
        content: data.content,
        likesCount: 0,
      })
      .returning();
    return { ...inserted[0], comments: [] };
  } catch (error) {
    console.error('Database query failed (createCommunityPostRecord):', error);
    throw new Error('Unable to publish community post.', { cause: error });
  }
}

export async function incrementPostLikes(postId: number) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const { data: existing, error: fetchErr } = await sb
      .from('community_posts')
      .select('*')
      .eq('id', postId)
      .limit(1)
      .maybeSingle();
    if (fetchErr) {
      throwSupabaseError('incrementPostLikes:fetch', 'Unable to like post.', fetchErr);
    }
    if (!existing) return null;
    const { data: updated, error: updErr } = await sb
      .from('community_posts')
      .update({ likes_count: (existing.likes_count || 0) + 1 })
      .eq('id', postId)
      .select('*')
      .single();
    if (updErr || !updated) {
      throwSupabaseError('incrementPostLikes:update', 'Unable to like post.', updErr);
    }
    return mapPostRow(updated);
  }

  try {
    const existing = await db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);
    if (!existing[0]) return null;
    const updated = await db
      .update(communityPosts)
      .set({ likesCount: existing[0].likesCount + 1 })
      .where(eq(communityPosts.id, postId))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database query failed (incrementPostLikes):', error);
    throw new Error('Unable to like post.', { cause: error });
  }
}

export async function createCommunityCommentRecord(data: {
  postId: number;
  userId: number;
  userUid?: string;
  authorName: string;
  content: string;
}) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const userKey = await resolveSupabaseUserKey(data.userId, data.userUid);
    const { data: inserted, error } = await sb
      .from('community_comments')
      .insert({
        post_id: data.postId,
        user_id: userKey,
        author_name: data.authorName,
        content: data.content,
      })
      .select('*')
      .single();
    if (error || !inserted) {
      throwSupabaseError('createCommunityCommentRecord', 'Unable to post comment.', error);
    }
    return mapCommentRow(inserted);
  }

  try {
    const inserted = await db
      .insert(communityComments)
      .values({
        postId: data.postId,
        userId: data.userId,
        authorName: data.authorName,
        content: data.content,
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Database query failed (createCommunityCommentRecord):', error);
    throw new Error('Unable to post comment.', { cause: error });
  }
}

export async function listPostpartumLogs(userId: number, userUid?: string) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const userKey = await resolveSupabaseUserKey(userId, userUid);
    const { data, error } = await sb
      .from('postpartum_logs')
      .select('*')
      .eq('user_id', userKey)
      .order('log_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) {
      throwSupabaseError('listPostpartumLogs', 'Unable to load postpartum logs.', error);
    }
    return (data || []).map(mapPostpartumRow);
  }

  try {
    return await db
      .select()
      .from(postpartumLogs)
      .where(eq(postpartumLogs.userId, userId))
      .orderBy(desc(postpartumLogs.logDate), desc(postpartumLogs.createdAt));
  } catch (error) {
    console.error('Database query failed (listPostpartumLogs):', error);
    throw new Error('Unable to load postpartum logs.', { cause: error });
  }
}

export async function createPostpartumLogRecord(data: {
  userId: number;
  userUid?: string;
  logDate: string;
  mood: string;
  sleepHours: string;
  feedingCount: number;
  painLevel: number;
  notes?: string;
}) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const userKey = await resolveSupabaseUserKey(data.userId, data.userUid);
    const { data: inserted, error } = await sb
      .from('postpartum_logs')
      .insert({
        user_id: userKey,
        log_date: data.logDate,
        mood: data.mood,
        sleep_hours: data.sleepHours,
        feeding_count: data.feedingCount,
        pain_level: data.painLevel,
        notes: data.notes ?? null,
      })
      .select('*')
      .single();
    if (error || !inserted) {
      throwSupabaseError('createPostpartumLogRecord', 'Unable to save recovery log.', error);
    }
    return mapPostpartumRow(inserted);
  }

  try {
    const inserted = await db
      .insert(postpartumLogs)
      .values({
        userId: data.userId,
        logDate: data.logDate,
        mood: data.mood,
        sleepHours: data.sleepHours,
        feedingCount: data.feedingCount,
        painLevel: data.painLevel,
        notes: data.notes ?? null,
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Database query failed (createPostpartumLogRecord):', error);
    throw new Error('Unable to save recovery log.', { cause: error });
  }
}

export async function getHydrationForDate(
  userId: number,
  logDate: string,
  userUid?: string
) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const userKey = await resolveSupabaseUserKey(userId, userUid);
    const { data, error } = await sb
      .from('hydration_logs')
      .select('*')
      .eq('user_id', userKey)
      .eq('log_date', logDate)
      .limit(1)
      .maybeSingle();
    if (error) {
      throwSupabaseError('getHydrationForDate', 'Unable to load hydration log.', error);
    }
    return data
      ? {
          id: data.id,
          userId: data.user_id,
          logDate: data.log_date,
          glassesCount: data.glasses_count,
        }
      : { userId: userKey, logDate, glassesCount: 0 };
  }

  try {
    const rows = await db
      .select()
      .from(hydrationLogs)
      .where(and(eq(hydrationLogs.userId, userId), eq(hydrationLogs.logDate, logDate)))
      .limit(1);
    return rows[0] ?? { userId, logDate, glassesCount: 0 };
  } catch (error) {
    console.error('Database query failed (getHydrationForDate):', error);
    throw new Error('Unable to load hydration log.', { cause: error });
  }
}

export async function setHydrationForDate(
  userId: number,
  logDate: string,
  glassesCount: number,
  userUid?: string
) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const userKey = await resolveSupabaseUserKey(userId, userUid);
    const { data: existing, error: fetchErr } = await sb
      .from('hydration_logs')
      .select('*')
      .eq('user_id', userKey)
      .eq('log_date', logDate)
      .limit(1)
      .maybeSingle();
    if (fetchErr) {
      throwSupabaseError('setHydrationForDate:fetch', 'Unable to update hydration log.', fetchErr);
    }
    if (existing) {
      const { data: updated, error: updErr } = await sb
        .from('hydration_logs')
        .update({ glasses_count: glassesCount, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select('*')
        .single();
      if (updErr || !updated) {
        throwSupabaseError('setHydrationForDate:update', 'Unable to update hydration log.', updErr);
      }
      return {
        id: updated.id,
        userId: updated.user_id,
        logDate: updated.log_date,
        glassesCount: updated.glasses_count,
      };
    }
    const { data: inserted, error: insErr } = await sb
      .from('hydration_logs')
      .insert({
        user_id: userKey,
        log_date: logDate,
        glasses_count: glassesCount,
      })
      .select('*')
      .single();
    if (insErr || !inserted) {
      throwSupabaseError('setHydrationForDate:insert', 'Unable to update hydration log.', insErr);
    }
    return {
      id: inserted.id,
      userId: inserted.user_id,
      logDate: inserted.log_date,
      glassesCount: inserted.glasses_count,
    };
  }

  try {
    const existing = await db
      .select()
      .from(hydrationLogs)
      .where(and(eq(hydrationLogs.userId, userId), eq(hydrationLogs.logDate, logDate)))
      .limit(1);
    if (existing[0]) {
      const updated = await db
        .update(hydrationLogs)
        .set({ glassesCount, updatedAt: new Date() })
        .where(eq(hydrationLogs.id, existing[0].id))
        .returning();
      return updated[0];
    }
    const inserted = await db
      .insert(hydrationLogs)
      .values({ userId, logDate, glassesCount })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Database query failed (setHydrationForDate):', error);
    throw new Error('Unable to update hydration log.', { cause: error });
  }
}

export async function getAdminOverview() {
  if (isSupabaseConfigured()) {
    await ensureSupabaseSeeded();
    const sb = getSupabaseClient()!;
    const { data: allUsers, error: uErr } = await sb
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (uErr) {
      throwSupabaseError('getAdminOverview:users', 'Unable to load admin dashboard metrics.', uErr);
    }

    const [
      { data: allDoctors, error: dErr },
      { data: allAppts, error: aErr },
      { data: allPosts, error: pErr },
    ] = await Promise.all([
      sb.from('doctors').select('*').order('id', { ascending: true }),
      sb
        .from('appointments')
        .select('*, users(full_name, email), doctors(name)')
        .order('created_at', { ascending: false }),
      sb.from('community_posts').select('*').order('created_at', { ascending: false }),
    ]);

    if (dErr) throwSupabaseError('getAdminOverview:doctors', 'Unable to load doctors.', dErr);
    if (aErr) throwSupabaseError('getAdminOverview:appointments', 'Unable to load visits.', aErr);
    if (pErr) throwSupabaseError('getAdminOverview:posts', 'Unable to load posts.', pErr);

    const mappedUsers = (allUsers || []).map((u) => sanitizeUser(mapUserRow(u)));
    const mappedDoctors = (allDoctors || []).map(mapDoctorRow);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedAppts = (allAppts || []).map((a: any) => ({
      id: a.id,
      userId: a.user_id,
      doctorId: a.doctor_id,
      appointmentDate: a.appointment_date,
      timeSlot: a.time_slot,
      consultationType: a.consultation_type,
      reason: a.reason,
      status: a.status,
      createdAt: a.created_at ? new Date(a.created_at) : null,
      patientName: a.users?.full_name,
      patientEmail: a.users?.email,
      doctorName: a.doctors?.name,
    }));
    const mappedPosts = (allPosts || []).map(mapPostRow);

    return {
      stats: {
        totalUsers: mappedUsers.length,
        activeUsers: mappedUsers.filter((u) => u.isActive).length,
        totalDoctors: mappedDoctors.length,
        totalAppointments: mappedAppts.length,
      },
      users: mappedUsers,
      doctors: mappedDoctors,
      appointments: mappedAppts,
      posts: mappedPosts,
    };
  }

  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    const allDoctors = await db.select().from(doctors).orderBy(doctors.id);
    const allAppointments = await db
      .select({
        id: appointments.id,
        userId: appointments.userId,
        doctorId: appointments.doctorId,
        appointmentDate: appointments.appointmentDate,
        timeSlot: appointments.timeSlot,
        consultationType: appointments.consultationType,
        reason: appointments.reason,
        status: appointments.status,
        createdAt: appointments.createdAt,
        patientName: users.fullName,
        patientEmail: users.email,
        doctorName: doctors.name,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.userId, users.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .orderBy(desc(appointments.createdAt));
    const allPosts = await db
      .select()
      .from(communityPosts)
      .orderBy(desc(communityPosts.createdAt));

    return {
      stats: {
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter((u) => u.isActive).length,
        totalDoctors: allDoctors.length,
        totalAppointments: allAppointments.length,
      },
      users: allUsers.map(sanitizeUser),
      doctors: allDoctors,
      appointments: allAppointments,
      posts: allPosts,
    };
  } catch (error) {
    console.error('Database query failed (getAdminOverview):', error);
    throw new Error('Unable to load admin dashboard metrics.', { cause: error });
  }
}

export async function adminUpdateUser(
  userId: number,
  updates: { isActive?: boolean; role?: string }
) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const payload: Record<string, unknown> = {};
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;
    if (updates.role !== undefined) payload.role = updates.role;
    const { data, error } = await sb
      .from('users')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .maybeSingle();
    if (error) {
      throwSupabaseError('adminUpdateUser', 'Unable to update user record.', error);
    }
    return data ? sanitizeUser(mapUserRow(data)) : null;
  }

  try {
    const updated = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return updated[0] ? sanitizeUser(updated[0]) : null;
  } catch (error) {
    console.error('Database query failed (adminUpdateUser):', error);
    throw new Error('Unable to update user record.', { cause: error });
  }
}

export async function adminUpdateAppointmentStatus(
  appointmentId: number,
  status: string
) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId)
      .select('*')
      .maybeSingle();
    if (error) {
      throwSupabaseError('adminUpdateAppointmentStatus', 'Unable to update appointment status.', error);
    }
    return data
      ? {
          id: data.id,
          userId: data.user_id,
          doctorId: data.doctor_id,
          appointmentDate: data.appointment_date,
          timeSlot: data.time_slot,
          consultationType: data.consultation_type,
          reason: data.reason,
          status: data.status,
          notes: data.notes ?? null,
          createdAt: data.created_at ? new Date(data.created_at) : null,
        }
      : null;
  }

  try {
    const updated = await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, appointmentId))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('Database query failed (adminUpdateAppointmentStatus):', error);
    throw new Error('Unable to update appointment status.', { cause: error });
  }
}

export async function adminDeleteCommunityPost(postId: number) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const { data, error } = await sb
      .from('community_posts')
      .delete()
      .eq('id', postId)
      .select('*')
      .maybeSingle();
    if (error) {
      throwSupabaseError('adminDeleteCommunityPost', 'Unable to remove community post.', error);
    }
    return data ? mapPostRow(data) : null;
  }

  try {
    const deleted = await db
      .delete(communityPosts)
      .where(eq(communityPosts.id, postId))
      .returning();
    return deleted[0] ?? null;
  } catch (error) {
    console.error('Database query failed (adminDeleteCommunityPost):', error);
    throw new Error('Unable to remove community post.', { cause: error });
  }
}
