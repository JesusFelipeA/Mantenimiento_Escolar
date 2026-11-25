import { supabase } from './supabase';

export function mensajeErrorAuth(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (m.includes('email not confirmed')) {
    return 'Confirma tu correo antes de iniciar sesión.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.';
  }
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
}

export function validarCredenciales(
  correo: string,
  contrasena: string,
): string | null {
  if (!correo.trim() || !contrasena) {
    return 'Escribe tu correo y tu contraseña.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
    return 'El correo no tiene un formato válido.';
  }
  return null;
}

export async function iniciarSesion(correo: string, contrasena: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email: correo.trim().toLowerCase(),
    password: contrasena,
  });
  if (error) {
    throw new Error(mensajeErrorAuth(error.message));
  }
}

export async function cerrarSesion() {
  await supabase.auth.signOut();
}
