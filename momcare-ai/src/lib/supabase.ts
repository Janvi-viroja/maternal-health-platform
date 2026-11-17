import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const url = process.env.SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key || url.includes('YOUR_SUPABASE_PROJECT_ID')) {
    cachedClient = null;
    return null;
  }

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedClient;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseClient() !== null;
}

export function getSupabaseActionableError(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const code = (error as { code?: string }).code;
  const message = ((error as { message?: string }).message || '').toLowerCase();

  if (code === '42501' || message.includes('row-level security') || message.includes('permission denied')) {
    return 'Supabase blocked this action because Row-Level Security (RLS) is enabled without access policies. Run the SQL policy script in Supabase SQL Editor or add SUPABASE_SERVICE_ROLE_KEY.';
  }

  if (
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes('schema cache') ||
    message.includes('does not exist')
  ) {
    return 'Supabase tables are missing. Please run supabase/schema.sql in your Supabase SQL Editor.';
  }

  return null;
}

export function throwSupabaseError(context: string, fallbackMessage: string, error: unknown): never {
  console.error(`Supabase error (${context}):`, error);
  const actionable = getSupabaseActionableError(error);
  if (actionable) {
    throw new Error(actionable);
  }
  throw new Error(fallbackMessage);
}
