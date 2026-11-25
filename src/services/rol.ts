import { createContext, useContext } from 'react';
import { supabase } from './supabase';

export type Rol = 'usuario' | 'mantenimiento';

/** Pregunta a Supabase si la cuenta actual es de personal de mantenimiento. */
export async function obtenerRol(): Promise<Rol> {
  const { data, error } = await supabase.rpc('es_mantenimiento');
  if (error) {
    // Si aún no se ejecutó supabase/admin.sql, la app funciona como usuario normal.
    console.warn('[Supabase] rol:', error.message);
    return 'usuario';
  }
  return data === true ? 'mantenimiento' : 'usuario';
}

export const RolContext = createContext<Rol>('usuario');
export const useRol = () => useContext(RolContext);
