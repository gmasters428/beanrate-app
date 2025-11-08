import { createServerClient } from '@supabase/ssr';
import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

type Ctx = { req: NextApiRequest; res: NextApiResponse; };

export function getServerSupabase(ctx: Ctx) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get: (name: string) => ctx.req.cookies?.[name],
        set: (name: string, value: string, options: any) => {
          const cookie = serialize(name, value, options);
          const prev = ctx.res.getHeader('Set-Cookie');
          if (!prev) ctx.res.setHeader('Set-Cookie', cookie);
          else if (Array.isArray(prev)) ctx.res.setHeader('Set-Cookie', [...prev, cookie]);
          else ctx.res.setHeader('Set-Cookie', [prev as string, cookie]);
        },
        remove: (name: string, options: any) => {
          const cookie = serialize(name, '', { ...options, maxAge: 0 });
          const prev = ctx.res.getHeader('Set-Cookie');
          if (!prev) ctx.res.setHeader('Set-Cookie', cookie);
          else if (Array.isArray(prev)) ctx.res.setHeader('Set-Cookie', [...prev, cookie]);
          else ctx.res.setHeader('Set-Cookie', [prev as string, cookie]);
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
