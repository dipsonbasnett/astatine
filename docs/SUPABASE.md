# Supabase data layer (review-only)

Status: migration authored locally on 2026-11-17 and applied to the hosted
`astatine` project on 2026-11-18 via the SQL editor, then verified against the
live database. No app code depends on it yet; Astatine still runs entirely on
local IndexedDB.

Migration: `supabase/migrations/20261117084508_initial_health_schema.sql`

## What it creates

Two schemas:

- `health` — personal data. Every table has `user_id`, owner-scoped RLS, and an
  index on the columns used by its policies.
- `research` — cited external evidence only. No `user_id`, no joins to personal
  tables, read-only for API roles.

Tables:

| Area                         | Tables                                                       |
| ---------------------------- | ------------------------------------------------------------ |
| Identity and preferences     | `profiles`, `consents`, `health_profiles`, `mission_support` |
| Daily data                   | `check_ins`, `vitals_observations`                           |
| Imaging                      | `imaging_studies`, `imaging_files`, `imaging_quality_checks` |
| Non-diagnostic analysis      | `imaging_analysis_results`, `urgency_assessments`            |
| Guidance and handoff         | `guidance_plans`, `handoff_summaries`                        |
| Reports and account requests | `reports`, `data_requests`                                   |
| Audit                        | `audit_events`                                               |
| Research                     | `research.sources`, `research.evidence`                      |

Ownership is enforced in two places:

1. RLS checks `(select auth.uid()) = user_id` for every row.
2. Composite foreign keys include `user_id`, so a child row cannot reference a
   study or file owned by another user even if the UUID is guessed.

Urgency values match the product spec: `routine`, `monitor`,
`medical_review_recommended`, `urgent_medical_review`,
`emergency_escalation`.

## Access model

- RLS is enabled on all 18 tables.
- Client roles (`authenticated`) can read and write only their own rows, and
  only for the operations granted below. Updates use both `USING` and
  `WITH CHECK` so a row's `user_id` cannot be reassigned.
- No client write policy exists for `imaging_analysis_results`,
  `audit_events`, `mission_support`, or either research table. Those are
  written with the service role only. Clients read their own analysis and audit
  rows; research rows are readable by `anon` and `authenticated`.
- `data_requests` records a user's export or deletion request. A server-side
  job with the service role performs the work and updates the status.
- The `health` and `research` schemas are **not** in the Data API exposed list
  (`supabase/config.toml` still exposes only `public` and `graphql_public`).
  The SQL grants exist so that exposing a schema later is an explicit,
  reviewable dashboard change rather than a silent default.

### Storage

- Bucket `crew-imaging`, private, 25 MiB limit, `image/jpeg`, `image/png`,
  `image/webp` only.
- Object path convention: `{user_id}/{study_id}/{file_id}.{ext}`.
- Separate select, insert, update, and delete policies on `storage.objects`,
  each requiring `bucket_id = 'crew-imaging'` and
  `(storage.foldername(name))[1] = auth.uid()`.
- `imaging_files.storage_path` has a check constraint that the first path
  segment equals `user_id`, and a per-user unique `sha256` to block duplicate
  uploads.
- No public URLs. The app should request signed URLs after the select policy
  passes.

### Keys

- Browser code may use `VITE_SUPABASE_URL` and the publishable (or legacy
  `anon`) key only.
- The database password, `service_role` key, and secret keys belong only in a
  server environment. Never add `VITE_` variables for them.
- The database password shared in chat on 2026-11-17 should be rotated in the
  dashboard before the project is used for real data.

## Apply it (owner)

Already applied to the hosted project on 2026-11-18; the steps below are for a
fresh project only.

1. Review the migration file and this document.
2. Supabase dashboard → **SQL Editor** → paste the file → **Run** once. The
   migration is wrapped in `begin;` / `commit;`, so a failure leaves no partial
   schema.
3. Run **Advisors** (Security and Performance) after applying. Expect no
   "RLS disabled" findings. Review any performance advisories before adding
   indexes.
4. Create users through Supabase Auth. The app server (or a first-run client
   step) should insert the matching `profiles` and `consents` rows; there is
   deliberately no trigger on `auth.users`.
5. Only when direct client access is intended, add a schema to the Data API's
   exposed schemas. Keeping `health` server-only is the safer default.

Do not run the migration twice; it is not idempotent by design.

## Verify after applying

```sql
-- Every health table must have RLS enabled.
select tablename, rowsecurity
from pg_tables
where schemaname = 'health'
order by tablename;

-- Policy inventory.
select tablename, policyname, roles, cmd
from pg_policies
where schemaname in ('health', 'research')
order by schemaname, tablename, policyname;

-- The bucket must be private.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'crew-imaging';
```

Then use the dashboard RLS tester or a second test account to confirm a user
cannot select another user's `check_ins`, `imaging_files`, or storage objects.

### Verified state (2026-11-18)

- 16 tables in `health`, 2 in `research`; RLS enabled on all of them.
- 47 policies across `health` and `research`, plus 4 owner-scoped policies on
  `storage.objects` for the `crew-imaging` bucket.
- `health.touch_updated_at()` present with 11 triggers.
- 45 table grants for `authenticated` on `health`, 2 for `anon` on `research`.
- `crew-imaging` bucket private, 25 MiB limit.
- The Data API exposes only `public` and `extensions`; `health` and `research`
  stay closed until explicitly added.
- Security Advisor shows no "RLS disabled" findings. Remaining advisories are
  the platform's `public.rls_auto_enable()` SECURITY DEFINER warning,
  composite-FK index suggestions, and unused-index notices — expected on a
  fresh, unused schema.
- Cross-user isolation has not yet been exercised with a second test account.

### Where to see the tables in the dashboard

- **Table Editor** lists only schemas enabled in the Data API settings
  (`public`, `extensions`), so it will look empty while `health` and `research`
  stay closed. That is the intended state; do not expose them just to browse.
- **Database → Schemas (Schema Visualizer)** has a schema dropdown that lists
  every schema, including `health` and `research`; select `health` to see the
  16 tables and their relationships.
- The **SQL Editor** shows the same tables with
  `select * from health.check_ins limit 10;` (and no owner rows will exist
  until users are created).

## Known limits

- Deleting an auth user cascades the database rows, but deleting
  `storage.objects` rows in SQL does not remove the stored bytes. The deletion
  job must remove objects through the Storage API with the service role before
  deleting the user.
- Audit events are only trustworthy if written server-side; there is no client
  insert policy.
- Simulated and research vitals are display-only and are not stored in
  `vitals_observations`.
- The schema does not make Astatine a medical device. Analysis results store
  non-diagnostic observations, confidence, limitations, and an urgency
  category; they do not store a diagnosis.

## Local CLI

`supabase/config.toml` was generated for future migrations. The CLI is not
linked to the hosted project, and no remote command has been run from this
workspace.
