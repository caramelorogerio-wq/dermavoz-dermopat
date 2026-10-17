-- Independent DermOpat schema: accounts and learned vocabulary only.
-- Deliberately no tables for patients, reports, audio, transcripts, or storage.

create table public.medicos (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  email text,
  aprendizagem_activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.termos_aprendidos (
  id uuid primary key default gen_random_uuid(),
  medico_id uuid not null references public.medicos(id) on delete cascade,
  termo text not null check (length(trim(termo)) > 0),
  correcao_de text,
  origem text not null default 'manual' check (origem in ('manual', 'automatico')),
  ocorrencias integer not null default 1 check (ocorrencias > 0),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (medico_id, termo, correcao_de)
);

create or replace function public.handle_new_medico()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.medicos (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_medico();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger medicos_updated_at before update on public.medicos
  for each row execute procedure public.set_updated_at();
create trigger termos_aprendidos_updated_at before update on public.termos_aprendidos
  for each row execute procedure public.set_updated_at();

alter table public.medicos enable row level security;
alter table public.termos_aprendidos enable row level security;

grant select, update on public.medicos to authenticated;
grant select, insert, update, delete on public.termos_aprendidos to authenticated;

create policy "Doctors read their own profile"
  on public.medicos for select to authenticated
  using ((select auth.uid()) = id);
create policy "Doctors update their own profile"
  on public.medicos for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Doctors manage their own vocabulary"
  on public.termos_aprendidos for all to authenticated
  using ((select auth.uid()) = medico_id)
  with check ((select auth.uid()) = medico_id);
