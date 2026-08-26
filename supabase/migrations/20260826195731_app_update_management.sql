begin;

set local lock_timeout = '30s';
set local statement_timeout = '2min';

create table public.app_updates (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'android',
  version_name text not null,
  build_number integer not null,
  minimum_build_number integer not null,
  release_title text not null,
  release_notes text[] not null default '{}',
  download_url text,
  force_update boolean not null default false,
  update_enabled boolean not null default false,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_updates_platform_check check (platform = 'android'),
  constraint app_updates_version_check check (version_name ~ '^[0-9]+[.][0-9]+[.][0-9]+([+-][0-9A-Za-z.-]+)?$'),
  constraint app_updates_build_check check (build_number > 0),
  constraint app_updates_minimum_build_check check (
    minimum_build_number > 0 and minimum_build_number <= build_number
  ),
  constraint app_updates_status_check check (status in ('draft', 'published', 'disabled')),
  constraint app_updates_download_url_check check (
    download_url is null or (
      download_url ~ '^https://'
      and download_url !~ '[[:space:]]'
      and download_url !~ '^https://[^/]*@'
    )
  ),
  constraint app_updates_platform_build_key unique (platform, build_number)
);

create unique index app_updates_one_published_platform_idx
  on public.app_updates(platform)
  where status = 'published';

create index app_updates_history_idx
  on public.app_updates(platform, build_number desc);

alter table public.app_updates enable row level security;

revoke all on table public.app_updates from public, anon, authenticated;
grant select, insert, update on table public.app_updates to authenticated;

create policy "admin aal2 reads app update history"
on public.app_updates
for select
to authenticated
using (public.is_admin_aal2());

create policy "admin aal2 creates app updates"
on public.app_updates
for insert
to authenticated
with check (public.is_admin_aal2());

create policy "admin aal2 updates app updates"
on public.app_updates
for update
to authenticated
using (public.is_admin_aal2())
with check (public.is_admin_aal2());

create or replace function public.set_app_update_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_app_update_updated_at() from public, anon, authenticated;

create trigger app_updates_set_updated_at
before update on public.app_updates
for each row execute function public.set_app_update_updated_at();

create or replace function public.publish_android_app_update(
  p_version_name text,
  p_build_number integer,
  p_minimum_build_number integer,
  p_release_title text,
  p_release_notes text[],
  p_download_url text,
  p_force_update boolean,
  p_update_enabled boolean
)
returns public.app_updates
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result public.app_updates;
  normalized_url text := nullif(trim(coalesce(p_download_url, '')), '');
begin
  if not public.is_admin_aal2() then
    raise exception using errcode = '42501', message = 'Administrator MFA/AAL2 required';
  end if;
  if trim(coalesce(p_version_name, '')) !~ '^[0-9]+[.][0-9]+[.][0-9]+([+-][0-9A-Za-z.-]+)?$' then
    raise exception using errcode = '22023', message = 'Invalid version name';
  end if;
  if p_build_number is null or p_build_number <= 0 then
    raise exception using errcode = '22023', message = 'Build number must be positive';
  end if;
  if p_minimum_build_number is null
     or p_minimum_build_number <= 0
     or p_minimum_build_number > p_build_number then
    raise exception using errcode = '22023', message = 'Invalid minimum build number';
  end if;
  if length(trim(coalesce(p_release_title, ''))) not between 3 and 120 then
    raise exception using errcode = '22023', message = 'Release title must be 3 to 120 characters';
  end if;
  if p_update_enabled and (
    normalized_url is null
    or normalized_url !~ '^https://'
    or normalized_url ~ '[[:space:]]'
    or normalized_url ~ '^https://[^/]*@'
  ) then
    raise exception using errcode = '22023', message = 'A valid HTTPS download URL is required';
  end if;

  update public.app_updates
  set status = 'disabled'
  where platform = 'android'
    and status = 'published'
    and build_number <> p_build_number;

  insert into public.app_updates (
    platform, version_name, build_number, minimum_build_number,
    release_title, release_notes, download_url, force_update,
    update_enabled, status, published_at
  )
  values (
    'android', trim(p_version_name), p_build_number, p_minimum_build_number,
    trim(p_release_title), coalesce(p_release_notes, '{}'), normalized_url,
    coalesce(p_force_update, false), coalesce(p_update_enabled, false),
    'published', now()
  )
  on conflict (platform, build_number) do update set
    version_name = excluded.version_name,
    minimum_build_number = excluded.minimum_build_number,
    release_title = excluded.release_title,
    release_notes = excluded.release_notes,
    download_url = excluded.download_url,
    force_update = excluded.force_update,
    update_enabled = excluded.update_enabled,
    status = 'published',
    published_at = now()
  returning * into result;

  return result;
end;
$$;

revoke all on function public.publish_android_app_update(
  text, integer, integer, text, text[], text, boolean, boolean
) from public, anon;
grant execute on function public.publish_android_app_update(
  text, integer, integer, text, text[], text, boolean, boolean
) to authenticated;

create or replace function public.get_android_app_update()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'updateEnabled', update_enabled,
        'latestVersion', version_name,
        'latestBuild', build_number,
        'minimumBuild', minimum_build_number,
        'forceUpdate', force_update,
        'downloadUrl', coalesce(download_url, ''),
        'releaseTitle', release_title,
        'releaseNotes', to_jsonb(release_notes)
      )
      from public.app_updates
      where platform = 'android' and status = 'published'
      order by build_number desc
      limit 1
    ),
    jsonb_build_object('updateEnabled', false)
  );
$$;

revoke all on function public.get_android_app_update() from public;
grant execute on function public.get_android_app_update() to anon, authenticated;

do $$
begin
  if to_regprocedure('public.capture_admin_audit()') is not null then
    execute 'create trigger app_updates_admin_audit
      after insert or update or delete on public.app_updates
      for each row execute function public.capture_admin_audit()';
  end if;
end;
$$;

insert into public.app_updates (
  platform, version_name, build_number, minimum_build_number,
  release_title, release_notes, download_url, force_update,
  update_enabled, status, published_at
)
values (
  'android', '1.2.3', 6, 6,
  'Dimsum Lumer 1.2.3', '{}', null, false,
  false, 'published', now()
)
on conflict (platform, build_number) do nothing;

notify pgrst, 'reload schema';
commit;
