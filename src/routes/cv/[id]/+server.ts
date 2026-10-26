import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { applications, profiles } from '$lib/server/db/schema';

export const GET = async ({ params, locals }) => {
  if (!locals.user) throw redirect(303, '/login');
  const [profile] = await db.select({role: profiles.role}).from(profiles).where(eq(profiles.id, locals.user.id)).limit(1);
  if (!profile) throw error(403, 'Access denied');
  const [application] = await db.select({applicantId: applications.applicantId, resumePath: applications.resumePath})
    .from(applications).where(eq(applications.id, params.id)).limit(1);
  if (!application?.resumePath) throw error(404, 'CV not found');
  const staff = ['owner','admin','recruiter','hiring_manager'].includes(profile.role);
  if (application.applicantId !== locals.user.id && !staff) throw error(403, 'Access denied');
  const { data, error: storageError } = await locals.supabase.storage.from('resumes').createSignedUrl(application.resumePath, 60, {download: true});
  if (storageError || !data?.signedUrl) throw error(502, 'Could not access CV');
  throw redirect(303, data.signedUrl);
};
