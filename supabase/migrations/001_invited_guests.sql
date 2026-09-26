-- Run once in a new Supabase project's SQL editor. No public signup/write access.
begin;
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  token_hash text unique not null check (token_hash ~ '^[a-f0-9]{64}$'),
  guest_name text not null check (length(guest_name) between 1 and 120),
  format_type text not null check (format_type in ('Sessions','Backstage')),
  season_number integer not null default 1 check (season_number > 0),
  already_recorded boolean not null default false,
  is_test boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  used_at timestamptz, revoked_at timestamptz
);
create table public.artists (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null unique references public.invitations(id),
  created_at timestamptz not null default now(),
  artist_name text not null check (length(artist_name) between 1 and 120),
  government_name text not null,
  email text not null,
  format_type text not null check (format_type in ('Sessions','Backstage')),
  season_number integer not null check (season_number > 0),
  already_recorded boolean not null default false,
  is_test boolean not null default true,
  linktree_url text not null,
  press_kit_url text not null default '',
  spotify_embed_url text not null default '',
  redirected_moment text not null default '',
  feature_promotion_focus text not null default '',
  musical_inspirations text not null default '',
  short_bio text not null check (cardinality(regexp_split_to_array(trim(short_bio), '\s+')) <= 100),
  pre_prod_call_requested boolean not null default false,
  pre_prod_call_status text not null default 'not_requested' check (pre_prod_call_status in ('not_requested','pending_scheduling','scheduled','completed')),
  off_limit_topics text not null default '',
  musical_roles text[] not null default '{}',
  creative_superpower text not null default '',
  collaboration_style text not null default '',
  technical_preferences text not null default '',
  backstage_location text not null default '',
  backstage_access text not null default '',
  backstage_timeline text not null default '',
  scheduled_shoot_date timestamptz,
  dietary_preferences text not null default '',
  other_comments text not null default '',
  content_release_accepted boolean not null default false,
  release_version text,
  release_accepted_at timestamptz,
  profile_live_status boolean not null default false,
  referral_code text unique not null default gen_random_uuid()::text,
  membership_tier text not null default 'cohort' check (membership_tier in ('cohort','alumni')),
  alumni_subscription_status text not null default 'inactive' check (alumni_subscription_status in ('active','inactive','canceled')),
  constraint safe_publication check (not profile_live_status or (not is_test and content_release_accepted and release_version is not null and release_accepted_at is not null)),
  constraint test_is_not_consent check (not is_test or not content_release_accepted),
  constraint consistent_call_status check ((pre_prod_call_requested and pre_prod_call_status <> 'not_requested') or (not pre_prod_call_requested and pre_prod_call_status = 'not_requested')),
  constraint recorded_no_booking check (not already_recorded or scheduled_shoot_date is null)
);
-- Only explicitly public fields exist here. No private guest answers or media-folder links.
create table public.artist_profiles (
  id uuid primary key references public.artists(id) on delete cascade,
  artist_name text not null,
  format_type text not null,
  season_number integer not null,
  short_bio text not null,
  linktree_url text not null,
  spotify_embed_url text not null default ''
);
alter table public.invitations enable row level security;
alter table public.artists enable row level security;
alter table public.artist_profiles enable row level security;
revoke all on public.invitations, public.artists, public.artist_profiles from anon, authenticated;
grant all on public.invitations, public.artists, public.artist_profiles to service_role;
grant select on public.artist_profiles to anon, authenticated;
create policy read_public_profiles on public.artist_profiles for select to anon, authenticated using (true);

create function public.sync_artist_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.profile_live_status and not new.is_test and new.content_release_accepted and new.release_version is not null and new.release_accepted_at is not null then
    insert into public.artist_profiles (id, artist_name, format_type, season_number, short_bio, linktree_url, spotify_embed_url)
    values (new.id, new.artist_name, new.format_type, new.season_number, new.short_bio, new.linktree_url, new.spotify_embed_url)
    on conflict (id) do update set artist_name=excluded.artist_name, format_type=excluded.format_type, season_number=excluded.season_number, short_bio=excluded.short_bio, linktree_url=excluded.linktree_url, spotify_embed_url=excluded.spotify_embed_url;
  else
    delete from public.artist_profiles where id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_artist_profile() from public, anon, authenticated;
create trigger sync_artist_profile after insert or update on public.artists for each row execute function public.sync_artist_profile();

-- Single transaction, row lock, and unique invitation_id prevent duplicate/replayed submissions.
-- Only the authenticated app server can execute this; the raw token is never stored.
create function public.submit_invited_artist(p_token_hash text, p_data jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare inv public.invitations; artist_id uuid; wants_call boolean;
begin
  select * into inv from public.invitations where token_hash = p_token_hash for update;
  if not found or inv.used_at is not null or inv.revoked_at is not null or inv.expires_at <= now() or inv.format_type <> p_data->>'format_type' then
    raise exception 'invitation_unavailable';
  end if;
  -- This milestone deliberately cannot collect live releases or publish real guests.
  if not inv.is_test or coalesce((p_data->>'test_acknowledged')::boolean, false) = false then
    raise exception 'test_acknowledgement_required';
  end if;
  wants_call := coalesce((p_data->>'pre_prod_call_requested')::boolean, false);
  insert into public.artists (
    invitation_id, artist_name, government_name, email, format_type, season_number, already_recorded, is_test,
    linktree_url, press_kit_url, spotify_embed_url, short_bio, redirected_moment, feature_promotion_focus,
    musical_inspirations, pre_prod_call_requested, pre_prod_call_status, off_limit_topics,
    musical_roles, creative_superpower, collaboration_style, technical_preferences,
    backstage_location, backstage_access, backstage_timeline, dietary_preferences, other_comments
  ) values (
    inv.id, p_data->>'artist_name', p_data->>'government_name', p_data->>'email', inv.format_type, inv.season_number, inv.already_recorded, true,
    p_data->>'linktree_url', coalesce(p_data->>'press_kit_url',''), coalesce(p_data->>'spotify_embed_url',''), p_data->>'short_bio', coalesce(p_data->>'redirected_moment',''), coalesce(p_data->>'feature_promotion_focus',''),
    coalesce(p_data->>'musical_inspirations',''), wants_call, case when wants_call then 'pending_scheduling' else 'not_requested' end, coalesce(p_data->>'off_limit_topics',''),
    case when inv.format_type='Sessions' then array(select jsonb_array_elements_text(coalesce(p_data->'musical_roles','[]'::jsonb))) else '{}'::text[] end,
    case when inv.format_type='Sessions' then coalesce(p_data->>'creative_superpower','') else '' end,
    case when inv.format_type='Sessions' then coalesce(p_data->>'collaboration_style','') else '' end,
    case when inv.format_type='Sessions' then coalesce(p_data->>'technical_preferences','') else '' end,
    case when inv.format_type='Backstage' then coalesce(p_data->>'backstage_location','') else '' end,
    case when inv.format_type='Backstage' then coalesce(p_data->>'backstage_access','') else '' end,
    case when inv.format_type='Backstage' then coalesce(p_data->>'backstage_timeline','') else '' end,
    coalesce(p_data->>'dietary_preferences',''), coalesce(p_data->>'other_comments','')
  ) returning id into artist_id;
  update public.invitations set used_at = now() where id = inv.id;
  return artist_id;
end;
$$;
revoke all on function public.submit_invited_artist(text,jsonb) from public, anon, authenticated;
grant execute on function public.submit_invited_artist(text,jsonb) to service_role;
commit;
