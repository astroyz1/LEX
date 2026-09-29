create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  title text check (title is null or char_length(title) <= 100),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null default '' check (char_length(body) <= 5000),
  attachment_path text,
  attachment_name text,
  attachment_size bigint,
  created_at timestamptz not null default now()
);
create index on public.messages (conversation_id, created_at);
create index on public.conversation_members (user_id);

grant select on public.conversations to authenticated;
grant select on public.conversation_members to authenticated;
grant update (last_read_at) on public.conversation_members to authenticated;
grant select, insert on public.messages to authenticated;
grant all on public.conversations, public.conversation_members, public.messages to service_role;

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_conversation_member(_cid uuid, _uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversation_members where conversation_id = _cid and user_id = _uid)
$$;
revoke execute on function public.is_conversation_member(uuid, uuid) from public, anon;
grant execute on function public.is_conversation_member(uuid, uuid) to authenticated;

create policy "members see conversation" on public.conversations for select to authenticated using (public.is_conversation_member(id, auth.uid()));
create policy "members see members" on public.conversation_members for select to authenticated using (public.is_conversation_member(conversation_id, auth.uid()));
create policy "update own read marker" on public.conversation_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "members read messages" on public.messages for select to authenticated using (public.is_conversation_member(conversation_id, auth.uid()));
create policy "members send messages" on public.messages for insert to authenticated with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id, auth.uid()));

create or replace function public.touch_conversation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  update public.conversation_members set last_read_at = new.created_at where conversation_id = new.conversation_id and user_id = new.sender_id;
  return new;
end $$;
revoke execute on function public.touch_conversation() from public, anon, authenticated;
create trigger messages_touch after insert on public.messages for each row execute function public.touch_conversation();

create or replace function public.start_conversation(_member_ids uuid[], _title text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  others uuid[];
  cid uuid;
begin
  if me is null then raise exception 'not authenticated'; end if;
  select array_agg(distinct m) into others from unnest(_member_ids) m where m <> me and exists (select 1 from public.profiles p where p.id = m);
  if others is null or array_length(others, 1) = 0 then raise exception 'choose at least one person'; end if;
  if array_length(others, 1) > 50 then raise exception 'too many members'; end if;
  if array_length(others, 1) = 1 then
    select c.id into cid from public.conversations c
    where not c.is_group
      and exists (select 1 from public.conversation_members where conversation_id = c.id and user_id = me)
      and exists (select 1 from public.conversation_members where conversation_id = c.id and user_id = others[1])
    limit 1;
    if cid is not null then return cid; end if;
    insert into public.conversations (is_group, created_by) values (false, me) returning id into cid;
  else
    insert into public.conversations (is_group, title, created_by) values (true, nullif(left(trim(coalesce(_title, '')), 100), ''), me) returning id into cid;
  end if;
  insert into public.conversation_members (conversation_id, user_id) select cid, u from unnest(others || me) u;
  return cid;
end $$;
revoke execute on function public.start_conversation(uuid[], text) from public, anon;
grant execute on function public.start_conversation(uuid[], text) to authenticated;

alter publication supabase_realtime add table public.messages;