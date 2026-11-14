-- Sprint 6.3 · Perfil inteligente, onboarding y foto privada
create table if not exists public.wellness_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 first_name text check (first_name is null or char_length(first_name) <= 100),
 last_name text check (last_name is null or char_length(last_name) <= 100),
 birth_date date check (birth_date is null or birth_date between date '1900-01-01' and current_date),
 sex_for_references text check (sex_for_references is null or sex_for_references in ('female','male','unspecified')),
 country text check (country is null or char_length(country) <= 100),
 timezone text check (timezone is null or char_length(timezone) <= 90),
 height_cm numeric check (height_cm is null or height_cm between 50 and 260),
 weight_kg numeric check (weight_kg is null or weight_kg between 15 and 350),
 activity_level text check (activity_level is null or activity_level in ('low','moderate','high','unspecified')),
 conditions text check (conditions is null or char_length(conditions) <= 2000),
 medications text check (medications is null or char_length(medications) <= 2000),
 allergies text check (allergies is null or char_length(allergies) <= 2000),
 history_notes text check (history_notes is null or char_length(history_notes) <= 2000),
 sleep_hours numeric check (sleep_hours is null or sleep_hours between 0 and 24),
 exercise_frequency text check (exercise_frequency is null or char_length(exercise_frequency) <= 100),
 nutrition_pattern text check (nutrition_pattern is null or char_length(nutrition_pattern) <= 300),
 hydration text check (hydration is null or char_length(hydration) <= 300),
 tobacco text check (tobacco is null or char_length(tobacco) <= 100),
 alcohol text check (alcohol is null or char_length(alcohol) <= 100),
 stress_level text check (stress_level is null or stress_level in ('low','moderate','high','unspecified')),
 goals text[] not null default '{}',
 communication_preference text check (communication_preference is null or communication_preference in ('simple','detailed','balanced')),
 ai_consent boolean not null default false,
 ai_consent_at timestamptz,
 photo_path text,
 completed_step integer not null default 1 check(completed_step between 1 and 5),
 updated_at timestamptz not null default now(),
 constraint ai_consent_timestamp_consistency check ((not ai_consent and ai_consent_at is null) or (ai_consent and ai_consent_at is not null)),
 constraint photo_user_path check (photo_path is null or (photo_path like user_id::text || '/%' and photo_path !~ '\.\.'))
);
alter table public.wellness_profiles enable row level security;
revoke all on public.wellness_profiles from anon;
grant select,insert,update on public.wellness_profiles to authenticated;
create policy wellness_profiles_select_own on public.wellness_profiles
 for select to authenticated using ((select auth.uid())=user_id);
create policy wellness_profiles_insert_own on public.wellness_profiles
 for insert to authenticated with check ((select auth.uid())=user_id);
create policy wellness_profiles_update_own on public.wellness_profiles
 for update to authenticated using ((select auth.uid())=user_id)
 with check ((select auth.uid())=user_id);
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('wellness-avatars','wellness-avatars',false,2097152,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=2097152,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy wellness_avatar_select_own on storage.objects
 for select to authenticated using (
 bucket_id='wellness-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text
);
create policy wellness_avatar_insert_own on storage.objects
 for insert to authenticated with check (
 bucket_id='wellness-avatars'
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and storage.extension(name) in ('jpg','jpeg','png','webp')
);
create policy wellness_avatar_update_own on storage.objects
 for update to authenticated using (
 bucket_id='wellness-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text
 ) with check (
 bucket_id='wellness-avatars'
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and storage.extension(name) in ('jpg','jpeg','png','webp')
);
create policy wellness_avatar_delete_own on storage.objects
 for delete to authenticated using (
 bucket_id='wellness-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text
);
