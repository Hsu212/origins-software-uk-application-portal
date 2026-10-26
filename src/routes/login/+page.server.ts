
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

import type {
  Actions,
  PageServerLoad
} from './$types';

const STAFF_ROLES = [
  'owner',
  'admin',
  'recruiter',
  'hiring_manager'
] as const;

function safeCandidateNext(value: string | null): string {
  if (!value) return '/account';

  if (
    !value.startsWith('/account') ||
    (
      value !== '/account' &&
      !value.startsWith('/account/') &&
      !value.startsWith('/account?')
    ) ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[\x00-\x1F\x7F]/.test(value)
  ) {
    return '/account';
  }

  return value;
}

export const load: PageServerLoad = async ({ url }) => {
  return {
    created: url.searchParams.get('created') === '1',

    email: url.searchParams.get('email') ?? '',

    verificationError:
      url.searchParams.get('error') === 'verification',

    next: safeCandidateNext(url.searchParams.get('next'))
  };
};

export const actions = {
  default: async ({ request, locals, url }) => {
    const form = await request.formData();

    const email = String(form.get('email') ?? '')
      .trim()
      .toLowerCase();

    const password = String(form.get('password') ?? '');

    const next = safeCandidateNext(
      url.searchParams.get('next') ??
      String(form.get('next') ?? '')
    );

    if (!email || !password) {
      return fail(400, {
        email,
        next,
        error: 'Please enter your email address and password.'
      });
    }

    // Authenticate against Supabase.

    const { data, error } =
      await locals.supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error || !data.user) {
      console.error('Login failed', {
        code: error?.code,
        message: error?.message
      });

      if (error?.status === 429) {
        return fail(429, {
          email,
          next,
          error: 'Too many login attempts. Please try again later.'
        });
      }

      return fail(400, {
        email,
        next,
        error:
          'Incorrect email or password, or your email has not been verified.'
      });
    }

    /*
      Verify the current authenticated user.

      Never trust role information submitted by the
      client, URL, form, or localStorage.
    */

    const {
      data: { user },
      error: userError
    } = await locals.supabase.auth.getUser();

    if (userError || !user) {
      await locals.supabase.auth.signOut();

      return fail(401, {
        email,
        next,
        error: 'Unable to verify your session. Please sign in again.'
      });
    }

    // Retrieve the authoritative database role.

    let profile: {
      role: typeof profiles.$inferSelect.role;
    } | undefined;

    try {
      const result = await db
        .select({
          role: profiles.role
        })
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1);

      profile = result[0];
    } catch (databaseError) {
      console.error('Login profile lookup failed', databaseError);

      await locals.supabase.auth.signOut();

      return fail(503, {
        email,
        next,
        error:
          'Your account is temporarily unavailable. Please try again later.'
      });
    }

    if (!profile) {
      await locals.supabase.auth.signOut();

      return fail(403, {
        email,
        next,
        error:
          'Your account profile is not configured. Please contact support.'
      });
    }

    /*
      HR permissions are assigned manually.

      No public-facing HR account creation is available.
    */

    if (
      STAFF_ROLES.some(
        (role) => role === profile.role
      )
    ) {
      throw redirect(303, '/hr');
    }

    /*
      Only applicants can enter the candidate workspace.

      Other account roles are not silently elevated
      or converted to applicants.
    */

    if (profile.role !== 'applicant') {
      await locals.supabase.auth.signOut();

      return fail(403, {
        email,
        next,
        error:
          'Your account does not have access to this portal.'
      });
    }

    // Resume the selected job application when applicable.

    throw redirect(303, next);
  }
} satisfies Actions;
