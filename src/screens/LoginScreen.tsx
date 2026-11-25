import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton, Campo, Mensaje } from '../components/ui';
import { iniciarSesion, validarCredenciales } from '../services/auth';
import { colores } from '../theme';
import { APP_VERSION } from '../version';

export default function LoginScreen() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    const invalido = validarCredenciales(correo, contrasena);
    if (invalido) {
      setError(invalido);
      return;
    }
    setError(null);
    setCargando(true);
    try {
      await iniciarSesion(correo, contrasena);
      // App.tsx detecta la sesión y cambia a la lista de reportes.
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <SafeAreaView style={s.fondo}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.flex}
      >
        <ScrollView
          contentContainerStyle={s.contenido}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.logo}>
            <Text style={s.logoTexto}>ME</Text>
          </View>
          <Text style={s.titulo}>Mantenimiento Escolar</Text>
          <Text style={s.subtitulo}>
            Reporta y da seguimiento a fallas en las instalaciones
          </Text>

          <View style={s.tarjeta}>
            <Text style={s.tarjetaTitulo}>Iniciar sesión</Text>
            {error && <Mensaje texto={error} />}
            <Campo
              etiqueta="Correo"
              value={correo}
              onChangeText={setCorreo}
              placeholder="usuario@escuela.edu.mx"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
            <Campo
              etiqueta="Contraseña"
              value={contrasena}
              onChangeText={setContrasena}
              placeholder="Tu contraseña"
              secureTextEntry
              autoComplete="password"
              onSubmitEditing={entrar}
            />
            <Boton titulo="Entrar" onPress={entrar} cargando={cargando} />
          </View>
          <Text style={s.version}>Versión {APP_VERSION}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.primario },
  flex: { flex: 1 },
  contenido: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  logoTexto: { fontSize: 28, fontWeight: '800', color: colores.primario },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: '#D6E4F2',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  tarjeta: { backgroundColor: colores.fondo, borderRadius: 16, padding: 20 },
  tarjetaTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: colores.texto,
    marginBottom: 14,
  },
  version: {
    color: '#D6E4F2',
    textAlign: 'center',
    marginTop: 18,
    fontSize: 12,
  },
});
