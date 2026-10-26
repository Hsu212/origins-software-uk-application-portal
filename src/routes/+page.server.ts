import { db } from '$lib/server/db';
import { jobs } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const openJobs = await db.select({ id: jobs.id, title: jobs.title, slug: jobs.slug,
    department: jobs.department, location: jobs.location, employmentType: jobs.employmentType,
    description: jobs.description, createdAt: jobs.createdAt })
    .from(jobs).where(eq(jobs.status, 'open')).orderBy(desc(jobs.createdAt));
  return { openJobs, signedIn: !!locals.user };
};
