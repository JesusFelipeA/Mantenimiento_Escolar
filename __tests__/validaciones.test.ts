jest.mock('../src/services/supabase', () => ({ supabase: {} }));

import { mensajeErrorAuth, validarCredenciales } from '../src/services/auth';
import { validarReporte } from '../src/services/reportes';

const base = {
  titulo: 'Lámpara fundida',
  categoria: 'Eléctrico',
  ubicacion: 'Edificio B, aula 12',
  descripcion: 'La lámpara del fondo no enciende desde ayer.',
  latitud: null,
  longitud: null,
};

describe('validarReporte', () => {
  test('acepta un reporte completo sin GPS ni foto', () => {
    expect(validarReporte(base)).toBeNull();
  });
  test('rechaza título corto', () => {
    expect(validarReporte({ ...base, titulo: 'Luz' })).toMatch(/título/);
  });
  test('rechaza sin categoría', () => {
    expect(validarReporte({ ...base, categoria: '' })).toMatch(/categoría/);
  });
  test('rechaza sin ubicación', () => {
    expect(validarReporte({ ...base, ubicacion: '  ' })).toMatch(/dónde/);
  });
  test('rechaza descripción corta', () => {
    expect(validarReporte({ ...base, descripcion: 'No sirve' })).toMatch(
      /Describe/,
    );
  });
});

describe('inicio de sesión', () => {
  test('pide correo y contraseña', () => {
    expect(validarCredenciales('', '')).not.toBeNull();
  });
  test('rechaza correo con formato inválido', () => {
    expect(validarCredenciales('usuario', '123456')).toMatch(/formato/);
  });
  test('acepta credenciales con formato correcto', () => {
    expect(validarCredenciales('alumno@escuela.edu.mx', '123456')).toBeNull();
  });
  test('traduce credenciales inválidas de Supabase', () => {
    expect(mensajeErrorAuth('Invalid login credentials')).toBe(
      'Correo o contraseña incorrectos.',
    );
  });
});
