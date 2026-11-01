-- Allow the public kitchen assistant to use the shared hashed-IP rate limiter.
create or replace function public.take_rate_limit(p_scope text,p_subject_hash text,p_window_seconds integer,p_max integer)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_hits integer;v_window bigint;
begin
 if p_scope not in ('checkout','booking','reward','media','assistant') or length(p_subject_hash)!=64 or p_window_seconds not between 60 and 86400 or p_max not between 1 and 100 then return false;end if;
 v_window:=floor(extract(epoch from now())/p_window_seconds);
 insert into public.api_rate_limits(scope,subject_hash,window_epoch,hits) values(p_scope,p_subject_hash,v_window,1)
 on conflict(scope,subject_hash,window_epoch) do update set hits=public.api_rate_limits.hits+1
 returning hits into v_hits;
 return v_hits<=p_max;
end $$;
revoke all on function public.take_rate_limit(text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.take_rate_limit(text,text,integer,integer) to service_role;
