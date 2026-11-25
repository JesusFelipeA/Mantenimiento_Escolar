import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Boton, EstadoBadge, Mensaje } from '../components/ui';
import type { RutasApp } from '../navigation';
import {
  actualizarEstado,
  obtenerReporte,
  Reporte,
  urlFoto,
} from '../services/reportes';
import { useRol } from '../services/rol';
import { formatoCoordenadas } from '../services/ubicacion';
import { colores, estados, EstadoReporte } from '../theme';

type Props = NativeStackScreenProps<RutasApp, 'Detalle'>;

export default function DetalleScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cambiando, setCambiando] = useState<EstadoReporte | null>(null);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);
  const esMantenimiento = useRol() === 'mantenimiento';

  async function cambiarEstado(nuevo: EstadoReporte) {
    setErrorEstado(null);
    setCambiando(nuevo);
    try {
      setReporte(await actualizarEstado(id, nuevo));
    } catch (e) {
      setErrorEstado((e as Error).message);
    } finally {
      setCambiando(null);
    }
  }

  useEffect(() => {
    navigation.setOptions({ title: `Folio #${id}` });
    (async () => {
      try {
        const r = await obtenerReporte(id);
        setReporte(r);
        if (r.foto_path) {
          setFoto(await urlFoto(r.foto_path));
        }
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [id, navigation]);

  if (error) {
    return (
      <View style={s.contenido}>
        <Mensaje texto={error} />
      </View>
    );
  }
  if (!reporte) {
    return (
      <ActivityIndicator
        style={s.cargando}
        color={colores.primario}
        size="large"
      />
    );
  }

  const pasos = ['pendiente', 'en_proceso', 'atendido'] as const;
  const actual = pasos.indexOf(reporte.estado);

  return (
    <ScrollView style={s.fondo} contentContainerStyle={s.contenido}>
      <View style={s.tarjeta}>
        <EstadoBadge estado={reporte.estado} />
        <Text style={s.titulo}>{reporte.titulo}</Text>
        <Text style={s.meta}>{reporte.categoria}</Text>

        <View style={s.progreso}>
          {pasos.map((p, i) => (
            <View key={p} style={s.paso}>
              <View
                style={[
                  s.punto,
                  i <= actual && { backgroundColor: estados[p].color },
                ]}
              />
              <Text style={[s.pasoTexto, i === actual && s.pasoActual]}>
                {estados[p].etiqueta}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {esMantenimiento ? (
        <View style={s.tarjeta}>
          <Text style={s.seccion}>Cambiar estado (mantenimiento)</Text>
          {errorEstado && <Mensaje texto={errorEstado} />}
          <View style={s.botonesEstado}>
            {pasos.map(p => (
              <Boton
                key={p}
                titulo={estados[p].etiqueta}
                variante={reporte.estado === p ? 'primario' : 'secundario'}
                deshabilitado={reporte.estado === p || cambiando !== null}
                cargando={cambiando === p}
                onPress={() => cambiarEstado(p)}
                estilo={s.botonEstado}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={s.tarjeta}>
        {esMantenimiento && reporte.correo ? (
          <Dato etiqueta="Reportado por" valor={reporte.correo} />
        ) : null}
        <Dato etiqueta="Ubicación" valor={reporte.ubicacion} />
        {reporte.latitud != null && reporte.longitud != null ? (
          <Pressable
            onPress={() =>
              Linking.openURL(
                `https://maps.google.com/?q=${reporte.latitud},${reporte.longitud}`,
              )
            }
          >
            <Dato
              etiqueta="Coordenadas GPS"
              valor={formatoCoordenadas(reporte.latitud, reporte.longitud)}
              enlace
            />
          </Pressable>
        ) : (
          <Dato etiqueta="Coordenadas GPS" valor="No registradas" />
        )}
        <Dato etiqueta="Descripción" valor={reporte.descripcion} />
        <Dato
          etiqueta="Registrado"
          valor={new Date(reporte.creado_en).toLocaleString('es-MX')}
        />
        <Dato
          etiqueta="Última actualización"
          valor={new Date(reporte.actualizado_en).toLocaleString('es-MX')}
        />
      </View>

      {reporte.foto_path ? (
        <View style={s.tarjeta}>
          <Text style={s.etiqueta}>Fotografía de evidencia</Text>
          {foto ? (
            <Image source={{ uri: foto }} style={s.foto} resizeMode="cover" />
          ) : (
            <ActivityIndicator color={colores.primario} />
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

function Dato({
  etiqueta,
  valor,
  enlace,
}: {
  etiqueta: string;
  valor: string;
  enlace?: boolean;
}) {
  return (
    <View style={s.dato}>
      <Text style={s.etiqueta}>{etiqueta}</Text>
      <Text style={[s.valor, enlace && s.enlace]}>{valor}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  fondo: { backgroundColor: colores.fondo },
  contenido: { padding: 16, paddingBottom: 40 },
  cargando: { marginTop: 40 },
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '800',
    color: colores.texto,
    marginTop: 10,
  },
  meta: { color: colores.textoSuave, marginTop: 2 },
  progreso: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  paso: { alignItems: 'center', flex: 1 },
  punto: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colores.borde,
    marginBottom: 6,
  },
  pasoTexto: { fontSize: 12, color: colores.textoSuave },
  pasoActual: { fontWeight: '800', color: colores.texto },
  dato: { marginBottom: 12 },
  etiqueta: {
    fontSize: 12,
    fontWeight: '700',
    color: colores.textoSuave,
    marginBottom: 3,
  },
  valor: { fontSize: 15, color: colores.texto },
  enlace: { color: colores.primario, textDecorationLine: 'underline' },
  seccion: {
    fontSize: 15,
    fontWeight: '800',
    color: colores.texto,
    marginBottom: 10,
  },
  botonesEstado: { flexDirection: 'row', gap: 8 },
  botonEstado: { flex: 1, paddingHorizontal: 6 },
  foto: {
    width: '100%',
    height: 260,
    borderRadius: 10,
    marginTop: 6,
    backgroundColor: colores.borde,
  },
});
