import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

export type ResultadoPermiso = 'concedido' | 'denegado' | 'bloqueado';

const { RESULTS, PERMISSIONS } = PermissionsAndroid;

function aviso(titulo: string, mensaje: string) {
  Alert.alert(titulo, mensaje, [
    { text: 'Ahora no', style: 'cancel' },
    { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
  ]);
}

/** Cámara: se pide solo cuando el usuario toca "Tomar foto". */
export async function pedirCamara(): Promise<ResultadoPermiso> {
  if (Platform.OS !== 'android') {
    return 'concedido';
  }
  const r = await PermissionsAndroid.request(PERMISSIONS.CAMERA, {
    title: 'Permiso de cámara',
    message:
      'Se usa para tomar la fotografía de evidencia del reporte. No se graba audio ni video.',
    buttonPositive: 'Continuar',
    buttonNegative: 'Ahora no',
  });
  if (r === RESULTS.GRANTED) {
    return 'concedido';
  }
  if (r === RESULTS.NEVER_ASK_AGAIN) {
    aviso(
      'Cámara bloqueada',
      'El permiso de cámara está desactivado. Puedes activarlo en Ajustes o elegir una foto de la galería.',
    );
    return 'bloqueado';
  }
  return 'denegado';
}

/**
 * Ubicación: se piden precisa y aproximada juntas para que en Android 12+
 * el usuario elija cuál conceder. Devuelve también si la concedida es precisa.
 */
export async function pedirUbicacion(): Promise<{
  resultado: ResultadoPermiso;
  precisa: boolean;
}> {
  if (Platform.OS !== 'android') {
    return { resultado: 'concedido', precisa: true };
  }
  const r = await PermissionsAndroid.requestMultiple([
    PERMISSIONS.ACCESS_FINE_LOCATION,
    PERMISSIONS.ACCESS_COARSE_LOCATION,
  ]);
  const fina = r[PERMISSIONS.ACCESS_FINE_LOCATION];
  const aprox = r[PERMISSIONS.ACCESS_COARSE_LOCATION];
  if (fina === RESULTS.GRANTED || aprox === RESULTS.GRANTED) {
    return { resultado: 'concedido', precisa: fina === RESULTS.GRANTED };
  }
  if (fina === RESULTS.NEVER_ASK_AGAIN || aprox === RESULTS.NEVER_ASK_AGAIN) {
    aviso(
      'Ubicación bloqueada',
      'El permiso de ubicación está desactivado. Puedes activarlo en Ajustes o escribir la ubicación manualmente.',
    );
    return { resultado: 'bloqueado', precisa: false };
  }
  return { resultado: 'denegado', precisa: false };
}
