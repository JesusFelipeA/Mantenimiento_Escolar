import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Asset,
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import { Boton, Campo, Mensaje } from '../components/ui';
import type { RutasApp } from '../navigation';
import { pedirCamara, pedirUbicacion } from '../services/permisos';
import { crearReporte, Foto, validarReporte } from '../services/reportes';
import { formatoCoordenadas, obtenerUbicacion } from '../services/ubicacion';
import { categorias, colores } from '../theme';

type Props = NativeStackScreenProps<RutasApp, 'NuevoReporte'>;

const opcionesFoto = {
  mediaType: 'photo' as const,
  includeBase64: true,
  maxWidth: 1280,
  maxHeight: 1280,
  quality: 0.7 as const,
};

export default function NuevoReporteScreen({ navigation }: Props) {
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [coords, setCoords] = useState<{
    latitud: number;
    longitud: number;
    precision: number;
  } | null>(null);
  const [foto, setFoto] = useState<Asset | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buscandoGps, setBuscandoGps] = useState(false);
  const [enviando, setEnviando] = useState(false);
  useEffect(() => {
    setError(null);
  }, [titulo, categoria, ubicacion, descripcion]);
  function recibirFoto(r: ImagePickerResponse) {
    if (r.didCancel) {
      return;
    }
    if (r.errorCode) {
      setError(
        r.errorCode === 'camera_unavailable'
          ? 'Este dispositivo no tiene cámara disponible.'
          : 'No se pudo obtener la imagen.',
      );
      return;
    }
    const a = r.assets?.[0];
    if (a?.base64) {
      setFoto(a);
      setError(null);
    }
  }

  async function tomarFoto() {
    const permiso = await pedirCamara();
    if (permiso !== 'concedido') {
      setAviso(
        'Sin permiso de cámara. Puedes elegir una foto de la galería o enviar el reporte sin foto.',
      );
      return;
    }
    setAviso(null);
    recibirFoto(
      await launchCamera({
        ...opcionesFoto,
        saveToPhotos: false,
        cameraType: 'back',
      }),
    );
  }

  async function elegirFoto() {
    // Selector de fotos del sistema: no requiere permiso de almacenamiento.
    recibirFoto(
      await launchImageLibrary({ ...opcionesFoto, selectionLimit: 1 }),
    );
  }

  async function usarGps() {
    const { resultado, precisa } = await pedirUbicacion();
    if (resultado !== 'concedido') {
      setAviso(
        'Sin permiso de ubicación. Escribe el edificio, aula o área en el campo "Ubicación".',
      );
      return;
    }
    setAviso(
      precisa
        ? null
        : 'Se concedió ubicación aproximada: las coordenadas tendrán menor precisión.',
    );
    setBuscandoGps(true);
    try {
      setCoords(await obtenerUbicacion(precisa));
    } catch (e) {
      setAviso(
        `${(e as Error).message} Puedes escribir la ubicación manualmente.`,
      );
    } finally {
      setBuscandoGps(false);
    }
  }

  async function enviar() {
    const datos = {
      titulo,
      categoria,
      ubicacion,
      descripcion,
      latitud: coords?.latitud ?? null,
      longitud: coords?.longitud ?? null,
    };
    const invalido = validarReporte(datos);
    if (invalido) {
      setError(invalido);
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      const archivo: Foto | null = foto?.base64
        ? { base64: foto.base64, tipo: foto.type ?? 'image/jpeg' }
        : null;
      const creado = await crearReporte(datos, archivo);
      Alert.alert(
        'Reporte registrado',
        `Folio #${creado.id} registrado correctamente.\nEstado: Pendiente.`,
        [{ text: 'Aceptar', onPress: () => navigation.goBack() }],
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={s.flex}
    >
      <ScrollView
        style={s.fondo}
        contentContainerStyle={s.contenido}
        keyboardShouldPersistTaps="handled"
      >
        {error && <Mensaje texto={error} />}
        {aviso && <Mensaje texto={aviso} tipo="info" />}

        <Campo
          etiqueta="Título"
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Ej. Lámpara fundida en el aula 12"
          maxLength={80}
        />

        <Text style={s.etiqueta}>Categoría</Text>
        <View style={s.chips}>
          {categorias.map(c => (
            <Pressable
              key={c}
              onPress={() => setCategoria(c)}
              style={[s.chip, categoria === c && s.chipActivo]}
            >
              <Text style={[s.chipTexto, categoria === c && s.chipTextoActivo]}>
                {c}
              </Text>
            </Pressable>
          ))}
        </View>

        <Campo
          etiqueta="Ubicación"
          value={ubicacion}
          onChangeText={setUbicacion}
          placeholder="Edificio, aula o área"
          maxLength={120}
        />

        <View style={s.gps}>
          <View style={s.flex}>
            <Text style={s.etiqueta}>Coordenadas GPS (opcional)</Text>
            <Text style={s.gpsTexto}>
              {coords
                ? `${formatoCoordenadas(
                    coords.latitud,
                    coords.longitud,
                  )}  ·  ±${coords.precision} m`
                : 'Sin coordenadas'}
            </Text>
          </View>
          <Boton
            titulo={coords ? 'Actualizar' : 'Obtener'}
            variante="secundario"
            onPress={usarGps}
            cargando={buscandoGps}
            estilo={s.gpsBoton}
          />
        </View>

        <Campo
          etiqueta="Descripción del problema"
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Describe qué ocurre y desde cuándo"
          multiline
          maxLength={1000}
        />

        <Text style={s.etiqueta}>Fotografía de evidencia (opcional)</Text>
        {foto?.uri ? (
          <View>
            <Image source={{ uri: foto.uri }} style={s.foto} />
            <Pressable onPress={() => setFoto(null)}>
              <Text style={s.quitar}>Quitar foto</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={s.filaBotones}>
          <Boton
            titulo="Tomar foto"
            variante="secundario"
            onPress={tomarFoto}
            estilo={s.flex}
          />
          <Boton
            titulo="Galería"
            variante="secundario"
            onPress={elegirFoto}
            estilo={s.flex}
          />
        </View>

        <Boton
          titulo="Enviar reporte"
          onPress={enviar}
          cargando={enviando}
          estilo={s.enviar}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  fondo: { backgroundColor: colores.fondo },
  contenido: { padding: 16, paddingBottom: 40 },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: colores.texto,
    marginBottom: 6,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colores.tarjeta,
  },
  chipActivo: {
    backgroundColor: colores.primario,
    borderColor: colores.primario,
  },
  chipTexto: { color: colores.texto, fontSize: 13 },
  chipTextoActivo: { color: '#fff', fontWeight: '700' },
  gps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colores.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  gpsTexto: { color: colores.textoSuave, fontSize: 13 },
  gpsBoton: { paddingHorizontal: 14, minHeight: 40, paddingVertical: 8 },
  foto: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    backgroundColor: colores.borde,
  },
  quitar: {
    color: colores.error,
    marginTop: 6,
    marginBottom: 10,
    fontWeight: '600',
  },
  filaBotones: { flexDirection: 'row', gap: 10 },
  enviar: { marginTop: 24 },
});
