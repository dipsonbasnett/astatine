-- Astatine initial health schema.
--
-- Review-only migration: apply it yourself in the Supabase SQL editor.
-- Astatine does not diagnose, predict medical events, or act as a medical
-- device. This schema stores user-reported data and, later, non-diagnostic
-- image observations produced by a server-side workflow.
--
-- Security model:
--   * health.*   personal data, owner-scoped RLS, not exposed to the Data API
--                until you explicitly add the schema to the exposed list.
--   * research.* cited external evidence with no personal data, read-only.
--   * storage    one private bucket; objects live under <user_id>/<study_id>/.
--
-- The whole migration runs in one transaction. Do not run it twice.

begin;

create schema if not exists health;
create schema if not exists research;

comment on schema health is
  'Personal crew health data. Owner-scoped RLS. Not exposed to the Data API unless explicitly enabled.';
comment on schema research is
  'Cited external research context. No personal data. Read-only for API roles.';

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function health.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = current_timestamp;
  return new;
end;
$$;

comment on function health.touch_updated_at() is
  'Sets updated_at on row updates. Trigger function; not intended to be called directly.';

-- ---------------------------------------------------------------------------
-- Profile, preferences, and baseline context
-- ---------------------------------------------------------------------------

create table health.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  callsign text check (callsign is null or char_length(callsign) between 1 and 40),
  role_label text check (role_label is null or char_length(role_label) between 1 and 80),
  time_zone text not null default 'UTC' check (char_length(time_zone) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table health.profiles is
  'Display preferences only. No medical content.';

create table health.consents (
  user_id uuid primary key references auth.users (id) on delete cascade,
  photo_capture boolean not null default false,
  cloud_image_storage boolean not null default false,
  ai_image_analysis boolean not null default false,
  research_participation boolean not null default false,
  consent_version integer not null default 1 check (consent_version > 0),
  consented_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table health.consents is
  'Per-user opt-in flags. All default to false; capture and analysis stay disabled until the user opts in.';

create table health.health_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  height_cm numeric(5, 1) check (height_cm is null or height_cm between 50 and 260),
  weight_kg numeric(5, 1) check (weight_kg is null or weight_kg between 20 and 400),
  conditions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(conditions) = 'array'),
  medications jsonb not null default '[]'::jsonb
    check (jsonb_typeof(medications) = 'array'),
  allergies jsonb not null default '[]'::jsonb
    check (jsonb_typeof(allergies) = 'array'),
  baseline_notes text check (baseline_notes is null or char_length(baseline_notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table health.health_profiles is
  'User-reported baseline context. Used to add context, never to diagnose.';

create table health.mission_support (
  singleton boolean primary key default true check (singleton),
  contact_label text check (contact_label is null or char_length(contact_label) between 1 and 120),
  contact_channel text check (contact_channel is null or char_length(contact_channel) between 1 and 300),
  updated_at timestamptz not null default now()
);

comment on table health.mission_support is
  'Single-row configuration for the mission medical support contact. Written only with the service role.';

-- ---------------------------------------------------------------------------
-- Daily check-ins and vitals
-- ---------------------------------------------------------------------------

create table health.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  observed_at timestamptz not null,
  sleep_hours numeric(4, 2) not null check (sleep_hours between 0 and 24),
  sleep_quality smallint not null check (sleep_quality between 1 and 5),
  fatigue smallint not null check (fatigue between 1 and 5),
  mood smallint not null check (mood between 1 and 5),
  soreness smallint not null check (soreness between 1 and 5),
  stress smallint not null check (stress between 1 and 5),
  hydration smallint not null check (hydration between 1 and 5),
  workload smallint check (workload between 1 and 5),
  exercise_planned_minutes integer check (exercise_planned_minutes between 0 and 1440),
  exercise_completed_minutes integer check (exercise_completed_minutes between 0 and 1440),
  hydration_entries integer check (hydration_entries between 0 and 64),
  nutrition_entries integer check (nutrition_entries between 0 and 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table health.check_ins is
  'Self-reported daily check-ins. Ratings are 1-5 as defined by the app, not clinical scores.';
comment on column health.check_ins.hydration is
  'Self-rated hydration on the app 1-5 scale; paired with hydration_entries when logged.';

create index check_ins_user_observed_idx
  on health.check_ins (user_id, observed_at desc);

create table health.vitals_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  observed_at timestamptz not null,
  metric text not null check (metric in (
    'heartRate',
    'spo2',
    'bloodPressure',
    'sleepRecovery',
    'activity',
    'hydration',
    'nutrition'
  )),
  value numeric(8, 3) not null,
  secondary_value numeric(8, 3),
  unit text not null check (char_length(unit) between 1 and 20),
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vitals_observations_bp_pair check (
    (metric = 'bloodPressure' and secondary_value is not null)
    or (metric <> 'bloodPressure' and secondary_value is null)
  )
);

comment on table health.vitals_observations is
  'Manually recorded vital measurements. Simulated and research values are never stored here.';

create index vitals_observations_user_observed_idx
  on health.vitals_observations (user_id, observed_at desc);
create index vitals_observations_user_metric_observed_idx
  on health.vitals_observations (user_id, metric, observed_at desc);

-- ---------------------------------------------------------------------------
-- Ultrasound studies and private image metadata
-- ---------------------------------------------------------------------------

create table health.imaging_studies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  captured_at timestamptz,
  body_region text not null check (char_length(body_region) between 1 and 80),
  symptom_summary text check (symptom_summary is null or char_length(symptom_summary) <= 4000),
  symptom_duration_hours numeric(7, 1) check (symptom_duration_hours is null or symptom_duration_hours >= 0),
  symptom_severity smallint check (symptom_severity between 1 and 5),
  relevant_history text check (relevant_history is null or char_length(relevant_history) <= 4000),
  medications text check (medications is null or char_length(medications) <= 4000),
  recent_activity text check (recent_activity is null or char_length(recent_activity) <= 2000),
  recent_sleep_hours numeric(4, 2) check (recent_sleep_hours is null or recent_sleep_hours between 0 and 24),
  hydration_context text check (hydration_context is null or char_length(hydration_context) <= 2000),
  nutrition_context text check (nutrition_context is null or char_length(nutrition_context) <= 2000),
  stress_level smallint check (stress_level between 1 and 5),
  status text not null default 'draft' check (status in ('draft', 'uploaded', 'analyzed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint imaging_studies_id_user_unique unique (id, user_id)
);

comment on table health.imaging_studies is
  'Structured context for one self-guided imaging session. Context is optional at draft stage and required before analysis.';
comment on column health.imaging_studies.status is
  'Workflow hint only. The UI derives analysis state from imaging_analysis_results.';

create index imaging_studies_user_created_idx
  on health.imaging_studies (user_id, created_at desc);

create table health.imaging_files (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null unique
    check (char_length(storage_path) between 1 and 512),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 26214400),
  width_px integer not null check (width_px > 0 and width_px <= 20000),
  height_px integer not null check (height_px > 0 and height_px <= 20000),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  quality_status text not null default 'pending' check (quality_status in ('pending', 'pass', 'warn', 'fail')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint imaging_files_id_user_unique unique (id, user_id),
  constraint imaging_files_user_sha256_unique unique (user_id, sha256),
  constraint imaging_files_study_owner_fkey
    foreign key (study_id, user_id)
    references health.imaging_studies (id, user_id)
    on delete cascade,
  constraint imaging_files_storage_owner_check
    check (split_part(storage_path, '/', 1) = user_id::text),
  constraint imaging_files_storage_study_check
    check (split_part(storage_path, '/', 2) = study_id::text)
);

comment on table health.imaging_files is
  'Metadata for a private bucket object. The object path must be <user_id>/<study_id>/<file>.';
comment on column health.imaging_files.sha256 is
  'Lowercase hex SHA-256 of the stored bytes; used to block duplicate uploads per user.';
comment on column health.imaging_files.quality_status is
  'Workflow hint only. The technical result lives in imaging_quality_checks.';

create index imaging_files_study_idx on health.imaging_files (study_id);

create table health.imaging_quality_checks (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  checks jsonb not null default '{}'::jsonb
    check (jsonb_typeof(checks) = 'object'),
  overall text not null check (overall in ('pass', 'warn', 'fail')),
  created_at timestamptz not null default now(),
  constraint imaging_quality_checks_file_owner_fkey
    foreign key (file_id, user_id)
    references health.imaging_files (id, user_id)
    on delete cascade
);

comment on table health.imaging_quality_checks is
  'Technical image checks only (focus, exposure, framing, orientation, duplicates). Not a diagnostic assessment. Immutable once written.';
comment on column health.imaging_quality_checks.checks is
  'Per-check results, e.g. {"focus":"pass","exposure":"warn"}. No diagnostic content.';

create index imaging_quality_checks_file_idx
  on health.imaging_quality_checks (file_id);
create index imaging_quality_checks_user_created_idx
  on health.imaging_quality_checks (user_id, created_at desc);

create table health.imaging_analysis_results (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (char_length(provider) between 1 and 60),
  model text not null check (char_length(model) between 1 and 120),
  model_version text check (model_version is null or char_length(model_version) <= 120),
  prompt_version text check (prompt_version is null or char_length(prompt_version) <= 60),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  urgency text not null check (urgency in (
    'routine',
    'monitor',
    'medical_review_recommended',
    'urgent_medical_review',
    'emergency_escalation'
  )),
  confidence text not null check (confidence in ('low', 'moderate', 'high')),
  limitations text not null check (char_length(limitations) between 1 and 4000),
  created_at timestamptz not null default now(),
  constraint imaging_analysis_results_file_owner_fkey
    foreign key (file_id, user_id)
    references health.imaging_files (id, user_id)
    on delete cascade
);

comment on table health.imaging_analysis_results is
  'Server-written model observations for one image. Non-diagnostic, immutable, and read-only for clients.';
comment on column health.imaging_analysis_results.urgency is
  'Conservative triage category. Red-flag escalation always takes precedence in the app.';

create index imaging_analysis_results_file_idx
  on health.imaging_analysis_results (file_id);
create index imaging_analysis_results_user_created_idx
  on health.imaging_analysis_results (user_id, created_at desc);

create table health.urgency_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  study_id uuid,
  source text not null check (source in ('self_report', 'local_rules', 'ai_assisted')),
  category text not null check (category in (
    'routine',
    'monitor',
    'medical_review_recommended',
    'urgent_medical_review',
    'emergency_escalation'
  )),
  red_flags text[] not null default '{}',
  rationale text check (rationale is null or char_length(rationale) <= 4000),
  created_at timestamptz not null default now(),
  constraint urgency_assessments_study_owner_fkey
    foreign key (study_id, user_id)
    references health.imaging_studies (id, user_id)
    on delete set null (study_id)
);

comment on table health.urgency_assessments is
  'Recorded triage decision and its basis. Immutable once written; red flags are stored verbatim.';

create index urgency_assessments_user_created_idx
  on health.urgency_assessments (user_id, created_at desc);
create index urgency_assessments_study_idx
  on health.urgency_assessments (study_id);

-- ---------------------------------------------------------------------------
-- Guidance, handoff, reports, and account requests
-- ---------------------------------------------------------------------------

create table health.guidance_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  study_id uuid,
  plan jsonb not null check (jsonb_typeof(plan) = 'object'),
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guidance_plans_study_owner_fkey
    foreign key (study_id, user_id)
    references health.imaging_studies (id, user_id)
    on delete set null (study_id)
);

comment on table health.guidance_plans is
  'Non-diagnostic improvement guidance with its rationale and evidence references.';

create index guidance_plans_user_created_idx
  on health.guidance_plans (user_id, created_at desc);
create index guidance_plans_study_idx
  on health.guidance_plans (study_id);

create table health.handoff_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  study_id uuid,
  summary jsonb not null check (jsonb_typeof(summary) = 'object'),
  audience text not null default 'mission_medical_support'
    check (char_length(audience) between 1 and 80),
  created_at timestamptz not null default now(),
  constraint handoff_summaries_study_owner_fkey
    foreign key (study_id, user_id)
    references health.imaging_studies (id, user_id)
    on delete set null (study_id)
);

comment on table health.handoff_summaries is
  'Structured preparation material for mission medical review. Explicitly not a diagnosis.';

create index handoff_summaries_user_created_idx
  on health.handoff_summaries (user_id, created_at desc);
create index handoff_summaries_study_idx
  on health.handoff_summaries (study_id);

create table health.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  window_days smallint not null check (window_days between 1 and 365),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table health.reports is
  'Generated report snapshots. Immutable once written.';

create index reports_user_generated_idx
  on health.reports (user_id, generated_at desc);

create table health.data_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('export', 'deletion')),
  status text not null default 'requested'
    check (status in ('requested', 'processing', 'completed', 'failed')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table health.data_requests is
  'User-initiated export or deletion requests. A server-side job with the service role performs the work.';
comment on column health.data_requests.status is
  'Updated only by the server-side job; clients can create and read their own requests.';

create index data_requests_user_requested_idx
  on health.data_requests (user_id, requested_at desc);

create table health.audit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  event text not null check (char_length(event) between 1 and 60),
  entity text check (entity is null or char_length(entity) <= 60),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

comment on table health.audit_events is
  'Append-only event log. Written only with the service role; clients can read their own events.';
comment on column health.audit_events.metadata is
  'Non-clinical context only. Never store image bytes, free-text symptoms, or measurement values here.';

create index audit_events_user_created_idx
  on health.audit_events (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Research context (no personal data)
-- ---------------------------------------------------------------------------

create table research.sources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 300),
  publisher text not null check (char_length(publisher) between 1 and 200),
  url text not null unique check (url ~ '^https?://'),
  published_on date,
  accessed_on date,
  license text check (license is null or char_length(license) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table research.sources is
  'Cited external sources. Maintained with the service role; readable by anon and authenticated.';

create table research.evidence (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references research.sources (id) on delete cascade,
  topic text not null check (char_length(topic) between 1 and 80),
  claim text not null check (char_length(claim) <= 4000),
  population text check (population is null or char_length(population) <= 1000),
  limitations text check (limitations is null or char_length(limitations) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table research.evidence is
  'Population-level findings linked to a source. Never joined to a user or a study.';

create index evidence_source_idx on research.evidence (source_id);
create index evidence_topic_idx on research.evidence (topic);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger profiles_touch_updated_at
  before update on health.profiles
  for each row execute function health.touch_updated_at();

create trigger consents_touch_updated_at
  before update on health.consents
  for each row execute function health.touch_updated_at();

create trigger health_profiles_touch_updated_at
  before update on health.health_profiles
  for each row execute function health.touch_updated_at();

create trigger mission_support_touch_updated_at
  before update on health.mission_support
  for each row execute function health.touch_updated_at();

create trigger check_ins_touch_updated_at
  before update on health.check_ins
  for each row execute function health.touch_updated_at();

create trigger vitals_observations_touch_updated_at
  before update on health.vitals_observations
  for each row execute function health.touch_updated_at();

create trigger imaging_studies_touch_updated_at
  before update on health.imaging_studies
  for each row execute function health.touch_updated_at();

create trigger imaging_files_touch_updated_at
  before update on health.imaging_files
  for each row execute function health.touch_updated_at();

create trigger guidance_plans_touch_updated_at
  before update on health.guidance_plans
  for each row execute function health.touch_updated_at();

create trigger research_sources_touch_updated_at
  before update on research.sources
  for each row execute function health.touch_updated_at();

create trigger research_evidence_touch_updated_at
  before update on research.evidence
  for each row execute function health.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table health.profiles enable row level security;
alter table health.consents enable row level security;
alter table health.health_profiles enable row level security;
alter table health.mission_support enable row level security;
alter table health.check_ins enable row level security;
alter table health.vitals_observations enable row level security;
alter table health.imaging_studies enable row level security;
alter table health.imaging_files enable row level security;
alter table health.imaging_quality_checks enable row level security;
alter table health.imaging_analysis_results enable row level security;
alter table health.urgency_assessments enable row level security;
alter table health.guidance_plans enable row level security;
alter table health.handoff_summaries enable row level security;
alter table health.reports enable row level security;
alter table health.data_requests enable row level security;
alter table health.audit_events enable row level security;
alter table research.sources enable row level security;
alter table research.evidence enable row level security;

-- Profile and preferences -----------------------------------------------------

create policy profiles_select_own on health.profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy profiles_insert_own on health.profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy profiles_update_own on health.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy profiles_delete_own on health.profiles
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy consents_select_own on health.consents
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy consents_insert_own on health.consents
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy consents_update_own on health.consents
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy health_profiles_select_own on health.health_profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy health_profiles_insert_own on health.health_profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy health_profiles_update_own on health.health_profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy health_profiles_delete_own on health.health_profiles
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy mission_support_select_authenticated on health.mission_support
  for select to authenticated
  using (true);

-- Daily entries ---------------------------------------------------------------

create policy check_ins_select_own on health.check_ins
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy check_ins_insert_own on health.check_ins
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy check_ins_update_own on health.check_ins
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy check_ins_delete_own on health.check_ins
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy vitals_observations_select_own on health.vitals_observations
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy vitals_observations_insert_own on health.vitals_observations
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy vitals_observations_update_own on health.vitals_observations
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy vitals_observations_delete_own on health.vitals_observations
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Imaging ---------------------------------------------------------------------

create policy imaging_studies_select_own on health.imaging_studies
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy imaging_studies_insert_own on health.imaging_studies
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy imaging_studies_update_own on health.imaging_studies
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy imaging_studies_delete_own on health.imaging_studies
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy imaging_files_select_own on health.imaging_files
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy imaging_files_insert_own on health.imaging_files
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy imaging_files_update_own on health.imaging_files
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy imaging_files_delete_own on health.imaging_files
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy imaging_quality_checks_select_own on health.imaging_quality_checks
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy imaging_quality_checks_insert_own on health.imaging_quality_checks
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy imaging_analysis_results_select_own on health.imaging_analysis_results
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Triage, guidance, and handoff ------------------------------------------------

create policy urgency_assessments_select_own on health.urgency_assessments
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy urgency_assessments_insert_own on health.urgency_assessments
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy guidance_plans_select_own on health.guidance_plans
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy guidance_plans_insert_own on health.guidance_plans
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy guidance_plans_update_own on health.guidance_plans
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy handoff_summaries_select_own on health.handoff_summaries
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy handoff_summaries_insert_own on health.handoff_summaries
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy handoff_summaries_delete_own on health.handoff_summaries
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Reports, requests, and audit -------------------------------------------------

create policy reports_select_own on health.reports
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy reports_insert_own on health.reports
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy reports_delete_own on health.reports
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy data_requests_select_own on health.data_requests
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy data_requests_insert_own on health.data_requests
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy audit_events_select_own on health.audit_events
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Research (no personal data) ---------------------------------------------------

create policy research_sources_read on research.sources
  for select to anon, authenticated
  using (true);

create policy research_evidence_read on research.evidence
  for select to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

revoke all on schema health from public;
revoke all on all tables in schema health from public;
revoke all on all sequences in schema health from public;
revoke all on schema research from public;
revoke all on all tables in schema research from public;

grant usage on schema health to authenticated;

grant select, insert, update, delete on health.profiles to authenticated;
grant select, insert, update on health.consents to authenticated;
grant select, insert, update, delete on health.health_profiles to authenticated;
grant select on health.mission_support to authenticated;
grant select, insert, update, delete on health.check_ins to authenticated;
grant select, insert, update, delete on health.vitals_observations to authenticated;
grant select, insert, update, delete on health.imaging_studies to authenticated;
grant select, insert, update, delete on health.imaging_files to authenticated;
grant select, insert on health.imaging_quality_checks to authenticated;
grant select on health.imaging_analysis_results to authenticated;
grant select, insert on health.urgency_assessments to authenticated;
grant select, insert, update on health.guidance_plans to authenticated;
grant select, insert, delete on health.handoff_summaries to authenticated;
grant select, insert, delete on health.reports to authenticated;
grant select, insert on health.data_requests to authenticated;
grant select on health.audit_events to authenticated;

grant usage on schema research to anon, authenticated;
grant select on research.sources, research.evidence to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Private imaging bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'crew-imaging',
  'crew-imaging',
  false,
  26214400,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy crew_imaging_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'crew-imaging'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy crew_imaging_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'crew-imaging'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy crew_imaging_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'crew-imaging'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'crew-imaging'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy crew_imaging_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'crew-imaging'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

commit;
