-- Add email for owner-managed staff invites and allow staff promotion by account ID.
alter table public.profiles add column if not exists email text;
update public.profiles p set email=u.email from auth.users u where p.id=u.id and p.email is null;
create or replace function public.new_user_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,display_name,email) values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),100),new.email)
 on conflict(id) do update set email=excluded.email;
 return new;
end $$;
-- Server-side atomic rate limiting. Keys are hashed before being stored.
create table public.api_rate_limits (
 scope text not null, subject_hash text not null,window_epoch bigint not null,
 hits integer not null default 0,primary key(scope,subject_hash,window_epoch)
);
alter table public.api_rate_limits enable row level security;
create or replace function public.take_rate_limit(p_scope text,p_subject_hash text,p_window_seconds integer,p_max integer)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_hits integer;v_window bigint;
begin
 if p_scope not in ('checkout','booking','reward','media') or length(p_subject_hash)!=64 or p_window_seconds not between 60 and 86400 or p_max not between 1 and 100 then return false;end if;
 v_window:=floor(extract(epoch from now())/p_window_seconds);
 insert into public.api_rate_limits(scope,subject_hash,window_epoch,hits) values(p_scope,p_subject_hash,v_window,1)
 on conflict(scope,subject_hash,window_epoch) do update set hits=public.api_rate_limits.hits+1
 returning hits into v_hits;
 return v_hits<=p_max;
end $$;
revoke all on function public.take_rate_limit(text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.take_rate_limit(text,text,integer,integer) to service_role;
