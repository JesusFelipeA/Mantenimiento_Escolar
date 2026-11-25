-- Mantenimiento Escolar: esquema de Supabase
-- Ejecutar completo en Supabase → SQL Editor.

-- 1. Tabla de reportes ------------------------------------------------------
create table if not exists public.reportes (
  id             bigint generated always as identity primary key,
  usuario_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo         text not null check (char_length(titulo) between 5 and 80),
  categoria      text not null,
  ubicacion      text not null check (char_length(ubicacion) between 1 and 120),
  descripcion    text not null check (char_length(descripcion) between 10 and 1000),
  latitud        double precision check (latitud between -90 and 90),
  longitud       double precision check (longitud between -180 and 180),
  foto_path      text,
  estado         text not null default 'pendiente'
                 check (estado in ('pendiente', 'en_proceso', 'atendido')),
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists reportes_usuario_idx on public.reportes (usuario_id, creado_en desc);

-- Actualiza la fecha de modificación en cada cambio
create or replace function public.tocar_actualizado_en()
returns trigger language plpgsql as $$
begin
  new.actualizado_en := now();
  return new;
end $$;

drop trigger if exists reportes_actualizado_en on public.reportes;
create trigger reportes_actualizado_en
  before update on public.reportes
  for each row execute function public.tocar_actualizado_en();

-- 2. Permisos de la API y Row Level Security --------------------------------
-- En proyectos nuevos de Supabase las tablas creadas por SQL no se exponen
-- solas a la API: hay que dar el permiso al rol "authenticated". Solo se
-- concede leer e insertar; las filas que puede tocar cada usuario las limita RLS.
grant usage on schema public to authenticated;
grant select, insert on table public.reportes to authenticated;

alter table public.reportes enable row level security;

drop policy if exists "ver mis reportes" on public.reportes;
create policy "ver mis reportes" on public.reportes
  for select to authenticated using (usuario_id = auth.uid());

drop policy if exists "crear mis reportes" on public.reportes;
create policy "crear mis reportes" on public.reportes
  for insert to authenticated
  with check (usuario_id = auth.uid() and estado = 'pendiente');

-- No hay política de UPDATE/DELETE para usuarios: el estado lo cambia el
-- personal de mantenimiento desde el panel de Supabase (Table Editor).

-- 3. Bucket privado para las fotografías ------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidencias', 'evidencias', false, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Cada usuario solo puede subir y leer archivos dentro de su carpeta (<uid>/...)
drop policy if exists "subir mis evidencias" on storage.objects;
create policy "subir mis evidencias" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'evidencias' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "ver mis evidencias" on storage.objects;
create policy "ver mis evidencias" on storage.objects
  for select to authenticated
  using (bucket_id = 'evidencias' and (storage.foldername(name))[1] = auth.uid()::text);
