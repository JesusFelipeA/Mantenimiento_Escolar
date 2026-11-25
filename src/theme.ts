export const colores = {
  primario: '#1F4E79',
  primarioClaro: '#DCE8F5',
  fondo: '#F4F6F9',
  tarjeta: '#FFFFFF',
  texto: '#1B1F24',
  textoSuave: '#5B6573',
  borde: '#D6DCE4',
  error: '#C62828',
  exito: '#2E7D32',
};

export const estados = {
  pendiente: { etiqueta: 'Pendiente', color: '#B26A00', fondo: '#FFF1DB' },
  en_proceso: { etiqueta: 'En proceso', color: '#1565C0', fondo: '#E3EEFB' },
  atendido: { etiqueta: 'Atendido', color: '#2E7D32', fondo: '#E4F3E5' },
} as const;

export type EstadoReporte = keyof typeof estados;

export const categorias = [
  'Eléctrico',
  'Plomería',
  'Mobiliario',
  'Cómputo y red',
  'Limpieza',
  'Infraestructura',
] as const;
