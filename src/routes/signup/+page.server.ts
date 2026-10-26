
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeNext(value: string | null): string {
  if (!value) return '/account';

  // Candidates may only resume within their account workspace.
  if (
    !value.startsWith('/account') ||
    (value !== '/account' &&
      !value.startsWith('/account/') &&
      !value.startsWith('/account?'))
  ) {
    return '/account';
  }

  if (
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
    next: safeNext(url.searchParams.get('next'))
  };
};

export const actions = {
  default: async ({ request, locals, url }) => {
    const form = await request.formData();

    const fullName = String(form.get('fullName') ?? '')
      .trim()
      .replace(/\s+/g, ' ');

    const email = String(form.get('email') ?? '')
      .trim()
      .toLowerCase();

    const password = String(form.get('password') ?? '');

    const next = safeNext(
      url.searchParams.get('next') ??
      String(form.get('next') ?? '')
    );

    const values = {
      fullName,
      email,
      next
    };

    // Validate candidate details.

    if (!fullName || !email || !password) {
      return fail(400, {
        ...values,
        error: 'Please complete all required fields.'
      });
    }

    if (fullName.length < 2 || fullName.length > 120) {
      return fail(400, {
        ...values,
        error: 'Full name must contain between 2 and 120 characters.'
      });
    }

    if (
      email.length > 254 ||
      !EMAIL_REGEX.test(email)
    ) {
      return fail(400, {
        ...values,
        error: 'Please enter a valid email address.'
      });
    }

    if (password.length < 12 || password.length > 128) {
      return fail(400, {
        ...values,
        error: 'Password must contain between 12 and 128 characters.'
      });
    }

    /*
      SECURITY:

      Public signup is always candidate-only.

      No role, accountType, isAdmin, or HR permission is
      accepted from the browser.

      The database profile trigger must independently
      create every new profile with role = applicant.
    */

    const emailRedirectTo = new URL(
      '/auth/callback',
      url.origin
    );

    emailRedirectTo.searchParams.set('next', next);

    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,

      options: {
        emailRedirectTo: emailRedirectTo.toString(),

        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      console.error('Candidate registration failed', {
        code: error.code,
        message: error.message
      });

      if (
        error.code === 'over_email_send_rate_limit' ||
        error.status === 429
      ) {
        return fail(429, {
          ...values,
          error: 'Too many attempts. Please try again later.'
        });
      }

      return fail(400, {
        ...values,
        error:
          'We could not complete your registration. Please check your details or try again later.'
      });
    }

    if (!data.user) {
      return fail(500, {
        ...values,
        error: 'Unable to complete registration. Please try again.'
      });
    }

    /*
      If email confirmation is enabled, the user normally
      receives no session until verification.

      Profile creation must be handled by the database
      trigger, not by trusting browser-supplied fields.
    */

    if (!data.session) {
      const destination = new URL('/login', url.origin);

      destination.searchParams.set('created', '1');
      destination.searchParams.set('email', email);
      destination.searchParams.set('next', next);

      throw redirect(303, destination.pathname + destination.search);
    }

    /*
      If email verification is disabled, Supabase may
      create a session immediately.
    */

    throw redirect(303, next);
  }
} satisfies Actions;
