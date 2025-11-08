import { createServerClient } from '@supabase/ssr';
import { GetServerSidePropsContext } from 'next';

export function createServerSupabaseClient(context: GetServerSidePropsContext) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => context.req.cookies[name],
        set: (name, value, options) => {
          context.res.setHeader('Set-Cookie', `${name}=${value}; ${Object.entries(options || {}).map(([k, v]) => `${k}=${v}`).join('; ')}`);
        },
        remove: (name, options) => {
          context.res.setHeader('Set-Cookie', `${name}=; Max-Age=0; ${Object.entries(options || {}).map(([k, v]) => `${k}=${v}`).join('; ')}`);
        }
      }
    }
  );
}

export async function getServerSession(context: GetServerSidePropsContext) {
  const supabase = createServerSupabaseClient(context);
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
