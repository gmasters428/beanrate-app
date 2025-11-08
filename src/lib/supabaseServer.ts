import { createServerClient } from '@supabase/ssr';
import type { IncomingMessage, ServerResponse } from 'http';
import { serialize } from 'cookie';

type Ctx = { req: IncomingMessage & { cookies?: Record<string, string> }; res: ServerResponse & { getHeader: any; setHeader: any } };

export function getServerSupabase(ctx: Ctx) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get: (name: string) => (ctx.req as any).cookies?.[name],
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
