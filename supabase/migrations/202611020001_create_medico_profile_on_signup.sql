-- Zero-retention deployment: create only the clinician profile needed for
-- authentication and personalised vocabulary. Clinical reports are not stored.

create or replace function public.handle_new_medico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.medicos (id, nome, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nome', ''), split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update
  set
    nome = coalesce(nullif(excluded.nome, ''), public.medicos.nome),
    email = excluded.email;

  return new;
end;
$$;

revoke all on function public.handle_new_medico() from public;

drop trigger if exists on_auth_user_created_medico on auth.users;
create trigger on_auth_user_created_medico
  after insert on auth.users
  for each row execute procedure public.handle_new_medico();
