import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colores, estados, EstadoReporte } from '../theme';

type BotonProps = {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario';
  cargando?: boolean;
  deshabilitado?: boolean;
  estilo?: ViewStyle;
};

export function Boton({
  titulo,
  onPress,
  variante = 'primario',
  cargando,
  deshabilitado,
  estilo,
}: BotonProps) {
  const secundario = variante === 'secundario';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={deshabilitado || cargando}
      style={({ pressed }) => [
        s.boton,
        secundario && s.botonSecundario,
        (deshabilitado || cargando) && s.botonDeshabilitado,
        pressed && s.presionado,
        estilo,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={secundario ? colores.primario : '#fff'} />
      ) : (
        <Text style={[s.botonTexto, secundario && s.botonTextoSecundario]}>
          {titulo}
        </Text>
      )}
    </Pressable>
  );
}

export function Campo({
  etiqueta,
  ...props
}: TextInputProps & { etiqueta: string }) {
  return (
    <View style={s.campo}>
      <Text style={s.etiqueta}>{etiqueta}</Text>
      <TextInput
        placeholderTextColor={colores.textoSuave}
        style={[s.input, props.multiline && s.multilinea]}
        {...props}
      />
    </View>
  );
}

export function EstadoBadge({ estado }: { estado: EstadoReporte }) {
  const e = estados[estado] ?? estados.pendiente;
  return (
    <View style={[s.badge, { backgroundColor: e.fondo }]}>
      <Text style={[s.badgeTexto, { color: e.color }]}>{e.etiqueta}</Text>
    </View>
  );
}

export function Mensaje({
  texto,
  tipo = 'error',
}: {
  texto: string;
  tipo?: 'error' | 'info';
}) {
  return (
    <View style={[s.mensaje, tipo === 'info' && s.mensajeInfo]}>
      <Text style={[s.mensajeTexto, tipo === 'info' && s.mensajeTextoInfo]}>
        {texto}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  boton: {
    backgroundColor: colores.primario,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  botonSecundario: {
    backgroundColor: colores.tarjeta,
    borderWidth: 1,
    borderColor: colores.primario,
  },
  botonDeshabilitado: { opacity: 0.55 },
  presionado: { opacity: 0.8 },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  botonTextoSecundario: { color: colores.primario },
  campo: { marginBottom: 14 },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: colores.texto,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colores.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colores.texto,
  },
  multilinea: { minHeight: 96, textAlignVertical: 'top' },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeTexto: { fontSize: 12, fontWeight: '700' },
  mensaje: {
    backgroundColor: '#FDECEA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  mensajeInfo: { backgroundColor: colores.primarioClaro },
  mensajeTexto: { color: colores.error, fontSize: 14 },
  mensajeTextoInfo: { color: colores.primario },
});
