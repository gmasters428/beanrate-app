
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-client-info': 'supabase-js-web',
      },
    },
    db: {
      schema: 'public',
    },
  }
);
