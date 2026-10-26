import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/db/schema';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: {
        name: 'origins-talent-auth',
        sameSite: 'lax',
        secure: event.url.protocol === 'https:',
        path: '/'
      },
      cookies: {
        getAll: () => event.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            event.cookies.set(name, value, { ...options, path: '/' });
          }
        }
      }
    }
  );

  const {
    data: { user },
    error
  } = await event.locals.supabase.auth.getUser();

  if (error) {
    // Invalid/expired sessions are treated as signed out. Do not allow a
    // stale refresh token to crash SSR.
    event.locals.user = null;
  } else {
    event.locals.user = user;
  }

  // Route-level protection applies to page loads and every form action, not merely navigation UI.
  if (event.url.pathname === '/hr' || event.url.pathname.startsWith('/hr/')) {
    if (!event.locals.user) throw redirect(303, '/login');
    const [profile] = await db.select({ role: profiles.role }).from(profiles)
      .where(eq(profiles.id, event.locals.user.id)).limit(1);
    if (!profile || !['owner', 'admin', 'recruiter', 'hiring_manager'].includes(profile.role))
      throw error(403, 'This area is restricted to authorised hiring staff.');
  }
  if (event.url.pathname === '/account' || event.url.pathname.startsWith('/account/')) {
    if (!event.locals.user) throw redirect(303, '/login');
    const [profile] = await db.select({ role: profiles.role }).from(profiles)
      .where(eq(profiles.id, event.locals.user.id)).limit(1);
    if (!profile || profile.role !== 'applicant') throw error(403, 'Applicant access required.');
  }

  const response = await resolve(event, {
    filterSerializedResponseHeaders: (name) =>
      name === 'content-range' || name === 'x-supabase-api-version'
  });
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'geolocation=()');
  if (event.url.protocol === 'https:') response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return response;
};
