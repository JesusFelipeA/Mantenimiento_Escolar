import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Boton, EstadoBadge, Mensaje } from '../components/ui';
import type { RutasApp } from '../navigation';
import { listarReportes, Reporte } from '../services/reportes';
import { useRol } from '../services/rol';
import { colores, estados, EstadoReporte } from '../theme';

type Props = NativeStackScreenProps<RutasApp, 'Reportes'>;

function BotonAcercaDe() {
  const navigation = useNavigation<NativeStackNavigationProp<RutasApp>>();
  return (
    <Pressable onPress={() => navigation.navigate('AcercaDe')} hitSlop={10}>
      <Text style={s.headerBoton}>Acerca de</Text>
    </Pressable>
  );
}
type Filtro = 'todos' | EstadoReporte;

// native-stack llama a headerRight como función, no como componente: debe
// devolver un elemento para que los hooks de BotonAcercaDe vivan en su propio componente.
const renderBotonAcercaDe = () => <BotonAcercaDe />;

export default function ReportesScreen({ navigation }: Props) {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esMantenimiento = useRol() === 'mantenimiento';

    useLayoutEffect(() => {
    navigation.setOptions({
      title: esMantenimiento ? 'Todos los reportes' : 'Mis reportes',
      headerRight: renderBotonAcercaDe,
    });
  }, [navigation, esMantenimiento]);

  const cargar = useCallback(async () => {
    try {
      setError(null);
      setReportes(await listarReportes());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  // Recarga al volver a la pantalla (por ejemplo, después de crear un reporte).
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const conteo = useMemo(() => {
    const c: Record<Filtro, number> = {
      todos: reportes.length,
      pendiente: 0,
      en_proceso: 0,
      atendido: 0,
    };
    reportes.forEach(r => (c[r.estado] += 1));
    return c;
  }, [reportes]);

  const visibles =
    filtro === 'todos' ? reportes : reportes.filter(r => r.estado === filtro);
  const filtros: Filtro[] = ['todos', 'pendiente', 'en_proceso', 'atendido'];

  return (
    <View style={s.fondo}>
      <View style={s.filtros}>
        {filtros.map(f => (
          <Pressable
            key={f}
            onPress={() => setFiltro(f)}
            style={[s.chip, filtro === f && s.chipActivo]}
          >
            <Text style={[s.chipNumero, filtro === f && s.chipTextoActivo]}>
              {conteo[f]}
            </Text>
            <Text style={[s.chipTexto, filtro === f && s.chipTextoActivo]}>
              {f === 'todos' ? 'Todos' : estados[f].etiqueta}
            </Text>
          </Pressable>
        ))}
      </View>

      {cargando ? (
        <ActivityIndicator
          style={s.centro}
          color={colores.primario}
          size="large"
        />
      ) : (
        <FlatList
          data={visibles}
          keyExtractor={r => String(r.id)}
          contentContainerStyle={s.lista}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => {
                setRefrescando(true);
                cargar();
              }}
            />
          }
          ListHeaderComponent={error ? <Mensaje texto={error} /> : undefined}
          ListEmptyComponent={
            !error ? (
              <Text style={s.vacio}>
                {filtro !== 'todos'
                  ? 'No hay reportes con este estado.'
                  : esMantenimiento
                  ? 'No hay reportes registrados.'
                  : 'Aún no has registrado reportes.'}
              </Text>
            ) : undefined
          }
          renderItem={({ item }) => (
            <Pressable
              style={s.tarjeta}
              onPress={() => navigation.navigate('Detalle', { id: item.id })}
            >
              <View style={s.fila}>
                <Text style={s.folio}>Folio #{item.id}</Text>
                <EstadoBadge estado={item.estado} />
              </View>
              <Text style={s.tituloReporte}>{item.titulo}</Text>
              <Text style={s.meta}>
                {item.categoria} · {item.ubicacion}
              </Text>
              <Text style={s.fecha}>
                {new Date(item.creado_en).toLocaleString('es-MX')}
                {esMantenimiento && item.correo ? `  ·  ${item.correo}` : ''}
              </Text>
            </Pressable>
          )}
        />
      )}

      <View style={s.pie}>
        <Boton
          titulo="+ Nuevo reporte"
          onPress={() => navigation.navigate('NuevoReporte')}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.fondo },
  headerBoton: { color: '#fff', fontWeight: '600' },
  filtros: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: colores.primario,
  },
  chip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  chipActivo: { backgroundColor: '#fff' },
  chipNumero: { color: '#fff', fontSize: 18, fontWeight: '800' },
  chipTexto: { color: '#D6E4F2', fontSize: 11, fontWeight: '600' },
  chipTextoActivo: { color: colores.primario },
  centro: { marginTop: 40 },
  lista: { padding: 12, paddingBottom: 100 },
  vacio: { textAlign: 'center', color: colores.textoSuave, marginTop: 40 },
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  folio: { color: colores.textoSuave, fontSize: 12, fontWeight: '600' },
  tituloReporte: { fontSize: 16, fontWeight: '700', color: colores.texto },
  meta: { color: colores.textoSuave, marginTop: 2 },
  fecha: { color: colores.textoSuave, fontSize: 12, marginTop: 6 },
  pie: { position: 'absolute', left: 16, right: 16, bottom: 20 },
});
