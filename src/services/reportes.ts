import { decode } from 'base64-arraybuffer';
import { BUCKET_EVIDENCIAS } from '../config/env';
import type { EstadoReporte } from '../theme';
import { supabase } from './supabase';

export type Reporte = {
  id: number;
  usuario_id: string;
  titulo: string;
  categoria: string;
  ubicacion: string;
  descripcion: string;
  latitud: number | null;
  longitud: number | null;
  foto_path: string | null;
  estado: EstadoReporte;
  correo: string | null;
  creado_en: string;
  actualizado_en: string;
};

export type NuevoReporte = {
  titulo: string;
  categoria: string;
  ubicacion: string;
  descripcion: string;
  latitud: number | null;
  longitud: number | null;
};

export type Foto = { base64: string; tipo: string };

/** Validación del formulario (también se prueba en __tests__). */
export function validarReporte(r: NuevoReporte): string | null {
  if (r.titulo.trim().length < 5) {
    return 'El título debe tener al menos 5 caracteres.';
  }
  if (!r.categoria) {
    return 'Elige una categoría.';
  }
  if (!r.ubicacion.trim()) {
    return 'Escribe dónde está el problema (edificio, aula o área).';
  }
  if (r.descripcion.trim().length < 10) {
    return 'Describe el problema con al menos 10 caracteres.';
  }
  return null;
}

function errorRed(e: unknown): Error {
  // Los errores de Supabase (PostgrestError / StorageError) son objetos simples
  // con message y code, no instancias de Error.
  const obj = (e ?? {}) as {
    message?: string;
    code?: string;
    details?: string;
  };
  const m = typeof e === 'string' ? e : obj.message ?? String(e);
  console.warn('[Supabase]', obj.code ?? '', m, obj.details ?? '');
  if (/network|fetch|failed to fetch/i.test(m)) {
    return new Error(
      'Sin conexión con el servidor. Revisa tu internet e inténtalo de nuevo.',
    );
  }
  if (
    obj.code === 'PGRST205' ||
    obj.code === '42P01' ||
    /could not find the table|does not exist/i.test(m)
  ) {
    return new Error(
      'La tabla "reportes" no existe en Supabase. Ejecuta supabase/schema.sql en el SQL Editor.',
    );
  }
  if (obj.code === '42501' || /row-level security|permission denied/i.test(m)) {
    return new Error(
      'Supabase rechazó la operación por las reglas de seguridad (RLS).',
    );
  }
  if (/bucket not found/i.test(m)) {
    return new Error(
      'No existe el bucket "evidencias". Ejecuta supabase/schema.sql completo.',
    );
  }
  return new Error(obj.code ? `${m} (código ${obj.code})` : m);
}

export async function listarReportes(): Promise<Reporte[]> {
  try {
    const { data, error } = await supabase
      .from('reportes')
      .select('*')
      .order('creado_en', { ascending: false });
    if (error) {
      throw error;
    }
    return (data ?? []) as Reporte[];
  } catch (e) {
    throw errorRed(e);
  }
}

export async function obtenerReporte(id: number): Promise<Reporte> {
  const { data, error } = await supabase
    .from('reportes')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    throw errorRed(error);
  }
  return data as Reporte;
}

async function subirFoto(usuarioId: string, foto: Foto): Promise<string> {
  const ext = foto.tipo.includes('png') ? 'png' : 'jpg';
  // La carpeta lleva el id del usuario: las políticas del bucket solo
  // permiten leer y escribir dentro de la carpeta propia.
  const ruta = `${usuarioId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET_EVIDENCIAS)
    .upload(ruta, decode(foto.base64), {
      contentType: foto.tipo,
      upsert: false,
    });
  if (error) {
    throw errorRed(error);
  }
  return ruta;
}

export async function crearReporte(
  datos: NuevoReporte,
  foto: Foto | null,
): Promise<Reporte> {
  try {
    const { data: sesion } = await supabase.auth.getUser();
    const usuarioId = sesion.user?.id;
    if (!usuarioId) {
      throw new Error('La sesión expiró. Vuelve a iniciar sesión.');
    }
    const foto_path = foto ? await subirFoto(usuarioId, foto) : null;
    const { data, error } = await supabase
      .from('reportes')
      .insert({
        titulo: datos.titulo.trim(),
        categoria: datos.categoria,
        ubicacion: datos.ubicacion.trim(),
        descripcion: datos.descripcion.trim(),
        latitud: datos.latitud,
        longitud: datos.longitud,
        foto_path,
      })
      .select()
      .single();
    if (error) {
      throw error;
    }
    return data as Reporte;
  } catch (e) {
    throw errorRed(e);
  }
}

/** Solo personal de mantenimiento (lo garantiza RLS en Supabase). */
export async function actualizarEstado(
  id: number,
  estado: EstadoReporte,
): Promise<Reporte> {
  try {
    const { data, error } = await supabase
      .from('reportes')
      .update({ estado })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      throw error;
    }
    return data as Reporte;
  } catch (e) {
    throw errorRed(e);
  }
}

/** URL temporal (1 hora) para ver una foto del bucket privado. */
export async function urlFoto(ruta: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from(BUCKET_EVIDENCIAS)
    .createSignedUrl(ruta, 3600);
  return data?.signedUrl ?? null;
}
