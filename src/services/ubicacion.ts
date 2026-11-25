import Geolocation from '@react-native-community/geolocation';

// Los permisos se piden con PermissionsAndroid (services/permisos.ts),
// no desde la librería, para controlar el momento y el mensaje.
Geolocation.setRNConfiguration({
  skipPermissionRequests: true,
  locationProvider: 'auto',
});

export type Coordenadas = {
  latitud: number;
  longitud: number;
  precision: number;
};

export function obtenerUbicacion(precisa: boolean): Promise<Coordenadas> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos =>
        resolve({
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          precision: Math.round(pos.coords.accuracy),
        }),
      err => {
        const mensajes: Record<number, string> = {
          1: 'No hay permiso de ubicación.',
          2: 'La ubicación del dispositivo está desactivada o no hay señal.',
          3: 'Se agotó el tiempo para obtener la ubicación.',
        };
        reject(
          new Error(mensajes[err.code] ?? 'No se pudo obtener la ubicación.'),
        );
      },
      { enableHighAccuracy: precisa, timeout: 15000, maximumAge: 10000 },
    );
  });
}

export function formatoCoordenadas(lat: number, lon: number): string {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}
