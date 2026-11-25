import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Boton } from '../components/ui';
import { CORREO_SOPORTE } from '../config/env';
import { cerrarSesion } from '../services/auth';
import { useRol } from '../services/rol';
import { colores } from '../theme';
import { APP_BUILD, APP_VERSION } from '../version';

const permisos = [
  ['Internet', 'Enviar y consultar los reportes en el servidor (HTTPS).'],
  [
    'Cámara',
    'Tomar la fotografía de evidencia. Se pide solo al tocar "Tomar foto".',
  ],
  [
    'Ubicación',
    'Agregar las coordenadas del reporte. Se pide solo al tocar "Obtener" y nunca en segundo plano.',
  ],
  [
    'Fotos',
    'No se pide permiso: el selector del sistema entrega solo la imagen que eliges.',
  ],
];

export default function AcercaDeScreen() {
  const rol = useRol();
  return (
    <ScrollView style={s.fondo} contentContainerStyle={s.contenido}>
      <View style={s.tarjeta}>
        <Text style={s.nombre}>Mantenimiento Escolar</Text>
        <Text style={s.version}>
          Versión {APP_VERSION} ({APP_BUILD})
        </Text>
        <Text style={s.rol}>
          Cuenta:{' '}
          {rol === 'mantenimiento' ? 'Personal de mantenimiento' : 'Usuario'}
        </Text>
        <Text style={s.texto}>
          Aplicación para que estudiantes y personal administrativo registren
          reportes de mantenimiento de las instalaciones y consulten su estado.
        </Text>
      </View>

      <View style={s.tarjeta}>
        <Text style={s.seccion}>Permisos que usa la app</Text>
        {permisos.map(([p, d]) => (
          <View key={p} style={s.permiso}>
            <Text style={s.permisoNombre}>{p}</Text>
            <Text style={s.texto}>{d}</Text>
          </View>
        ))}
      </View>

      <View style={s.tarjeta}>
        <Text style={s.seccion}>Privacidad</Text>
        <Text style={s.texto}>
          Se guardan tu correo, los datos de cada reporte, la ubicación que
          agregues y la foto de evidencia. Cada usuario solo puede ver sus
          propios reportes y las fotos se guardan en un almacenamiento privado.
          La información se usa únicamente para atender el mantenimiento de la
          institución.
        </Text>
      </View>

      <View style={s.tarjeta}>
        <Text style={s.seccion}>Soporte</Text>
        <Text
          style={[s.texto, s.enlace]}
          onPress={() => Linking.openURL(`mailto:${CORREO_SOPORTE}`)}
        >
          {CORREO_SOPORTE}
        </Text>
      </View>

      <Boton
        titulo="Cerrar sesión"
        variante="secundario"
        onPress={cerrarSesion}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  fondo: { backgroundColor: colores.fondo },
  contenido: { padding: 16, paddingBottom: 40 },
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  nombre: { fontSize: 20, fontWeight: '800', color: colores.texto },
  version: {
    color: colores.primario,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 8,
  },
  rol: { color: colores.texto, fontWeight: '600', marginBottom: 8 },
  seccion: {
    fontSize: 15,
    fontWeight: '800',
    color: colores.texto,
    marginBottom: 8,
  },
  texto: { color: colores.textoSuave, fontSize: 14, lineHeight: 20 },
  permiso: { marginBottom: 8 },
  permisoNombre: { fontWeight: '700', color: colores.texto },
  enlace: { color: colores.primario, textDecorationLine: 'underline' },
});
