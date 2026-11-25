-- Mantenimiento Escolar: rol de personal de mantenimiento (administrador)
-- Ejecutar completo en Supabase → SQL Editor, DESPUÉS de schema.sql.

-- 1. Correo de quien reporta (para que mantenimiento sepa quién lo levantó) ---
alter table public.reportes
  add column if not exists correo text default (auth.jwt() ->> 'email');

-- 2. Lista de cuentas con rol de mantenimiento ----------------------------------
create table if not exists public.personal_mantenimiento (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  agregado_en timestamptz not null default now()
);

-- Nadie la lee ni la modifica desde la app; solo se administra con SQL.
alter table public.personal_mantenimiento enable row level security;

-- Función que la app y las políticas usan para saber si el usuario es de
-- mantenimiento. "security definer" le permite consultar la tabla anterior
-- aunque el usuario no tenga permiso directo sobre ella.
create or replace function public.es_mantenimiento()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.personal_mantenimiento where usuario_id = auth.uid()
  );
$$;

revoke all on function public.es_mantenimiento() from public;
grant execute on function public.es_mantenimiento() to authenticated;

-- 3. Políticas: mantenimiento ve todos los reportes y cambia el estado -------
drop policy if exists "mantenimiento ve todos" on public.reportes;
create policy "mantenimiento ve todos" on public.reportes
  for select to authenticated using (public.es_mantenimiento());

drop policy if exists "mantenimiento actualiza estado" on public.reportes;
create policy "mantenimiento actualiza estado" on public.reportes
  for update to authenticated
  using (public.es_mantenimiento())
  with check (public.es_mantenimiento());

-- Solo la columna "estado" se puede actualizar; el resto del reporte no cambia.
grant update (estado) on table public.reportes to authenticated;

-- 4. Mantenimiento puede ver las fotos de todos los reportes ----------------
drop policy if exists "mantenimiento ve evidencias" on storage.objects;
create policy "mantenimiento ve evidencias" on storage.objects
  for select to authenticated
  using (bucket_id = 'evidencias' and public.es_mantenimiento());

-- 5. Dar el rol a una cuenta (cambia el correo y ejecuta) --------------------
-- La cuenta debe existir antes en Authentication → Users.
insert into public.personal_mantenimiento (usuario_id)
select id from auth.users where email = 'admin@escuela.edu.mx'
on conflict do nothing;

-- Para quitar el rol:
-- delete from public.personal_mantenimiento
-- where usuario_id = (select id from auth.users where email = 'admin@escuela.edu.mx');
