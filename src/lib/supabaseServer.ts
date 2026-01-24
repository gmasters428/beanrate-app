import { createServerClient } from '@supabase/ssr';
import type { IncomingMessage, ServerResponse } from 'http';
import { serialize } from 'cookie';

type Ctx = { req: IncomingMessage & { cookies?: Record<string, string> }; res: ServerResponse & { getHeader: any; setHeader: any } };

const parseCookieHeader = (header?: string): Record<string, string> => {
  if (!header) return {};
  return header.split(';').reduce((acc, part) => {
    const [name, ...rest] = part.trim().split('=');
    if (!name) return acc;
    const value = rest.join('=');
    acc[name] = decodeURIComponent(value);
    return acc;
  }, {} as Record<string, string>);
};

const getRequestCookies = (req: IncomingMessage & { cookies?: Record<string, string> }) => {
  const headerCookies = parseCookieHeader(req.headers?.cookie);
  if (req.cookies) {
    return { ...headerCookies, ...req.cookies };
  }
  return headerCookies;
};

export function getServerSupabase(ctx: Ctx) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll: () => {
          const cookies = getRequestCookies(ctx.req);
          return Object.entries(cookies)
            .filter(([, value]) => typeof value === 'string')
            .map(([name, value]) => ({ name, value }));
        },
        setAll: (cookies) => {
          const serialized = cookies.map((cookie) =>
            serialize(cookie.name, cookie.value, cookie.options)
          );
          const prev = ctx.res.getHeader('Set-Cookie');
          if (!prev) ctx.res.setHeader('Set-Cookie', serialized);
          else if (Array.isArray(prev)) ctx.res.setHeader('Set-Cookie', [...prev, ...serialized]);
          else ctx.res.setHeader('Set-Cookie', [prev as string, ...serialized]);
        },
      }
    }
  );
}
