-- Sprint 6.5-D.0 / Bilingual canonical catalog pilot
-- Non-destructive: preserve public.indicators.id, code and all observations.
alter table public.indicators add column if not exists name_en text;
create table if not exists public.indicator_aliases (
 id bigint generated always as identity primary key,
 indicator_id uuid not null references public.indicators(id) on delete cascade,
 alias text not null check(length(trim(alias)) between 2 and 160),
 locale text not null check(locale in ('es','en')),
 review_status text not null default 'pilot' check(review_status in ('pilot','approved','rejected')),
 created_at timestamptz not null default now()
);
create unique index if not exists indicator_aliases_unique_per_indicator
 on public.indicator_aliases(indicator_id,lower(trim(alias)));
create index if not exists indicator_aliases_lookup
 on public.indicator_aliases(lower(trim(alias)));
alter table public.indicator_aliases enable row level security;
revoke all on public.indicator_aliases from anon,authenticated;
grant select on public.indicator_aliases to anon,authenticated;
drop policy if exists indicator_alias_public_read on public.indicator_aliases;
create policy indicator_alias_public_read on public.indicator_aliases
 for select to anon,authenticated using(review_status in ('pilot','approved'));
-- Existing stable REF codes are authoritative; no UUID is replaced.
update public.indicators
 set name_en='Apolipoprotein B (ApoB)',name_es='Apolipoproteína B (ApoB)'
 where code='REF-001' and (name_en is null or name_en='Apolipoprotein B (ApoB)');
update public.indicators
 set name_en='Glucose',name_es='Glucosa'
 where code='REF-017' and (name_en is null or name_en='Glucose');
insert into public.indicator_aliases(indicator_id,alias,locale,review_status)
select i.id,v.alias,v.locale,'pilot'
from (values
 ('REF-001','Apolipoproteína B (ApoB)','es'),
 ('REF-001','Apolipoproteína B','es'),
 ('REF-001','Apolipoprotein B (ApoB)','en'),
 ('REF-001','Apolipoprotein B','en'),
 ('REF-001','ApoB','en'),
 ('REF-001','Apo B','en'),
 ('REF-017','Glucosa','es'),
 ('REF-017','Glicemia','es'),
 ('REF-017','Glucemia','es'),
 ('REF-017','Glucose','en'),
 ('REF-017','Blood glucose','en'),
 ('REF-017','Glucosa en sangre','es')
) as v(code,alias,locale) join public.indicators i on i.code=v.code
on conflict do nothing;
-- The label-only pilot cannot modify scientific thresholds or patient measurements.
