import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { Session } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { RutasApp, RutasAuth } from './src/navigation';
import AcercaDeScreen from './src/screens/AcercaDeScreen';
import DetalleScreen from './src/screens/DetalleScreen';
import LoginScreen from './src/screens/LoginScreen';
import NuevoReporteScreen from './src/screens/NuevoReporteScreen';
import ReportesScreen from './src/screens/ReportesScreen';
import { obtenerRol, Rol, RolContext } from './src/services/rol';
import { supabase } from './src/services/supabase';
import { colores } from './src/theme';

const PilaApp = createNativeStackNavigator<RutasApp>();
const PilaAuth = createNativeStackNavigator<RutasAuth>();

const encabezado = {
  headerStyle: { backgroundColor: colores.primario },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' as const },
};

export default function App() {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [listo, setListo] = useState(false);
  const [rol, setRol] = useState<Rol>('usuario');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      setListo(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, s) =>
      setSesion(s),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  // El rol se consulta cada vez que cambia la cuenta con sesión.
  const usuarioId = sesion?.user.id;
  useEffect(() => {
    if (!usuarioId) {
      setRol('usuario');
      return;
    }
    obtenerRol().then(setRol);
  }, [usuarioId]);

  if (!listo) {
    return (
      <View style={st.splash}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <RolContext.Provider value={rol}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <NavigationContainer>
          {sesion ? (
            <PilaApp.Navigator screenOptions={encabezado}>
              {/* El título lo pone ReportesScreen según el rol */}
              <PilaApp.Screen name="Reportes" component={ReportesScreen} />
              <PilaApp.Screen
                name="NuevoReporte"
                component={NuevoReporteScreen}
                options={{ title: 'Nuevo reporte' }}
              />
              <PilaApp.Screen
                name="Detalle"
                component={DetalleScreen}
                options={{ title: 'Reporte' }}
              />
              <PilaApp.Screen
                name="AcercaDe"
                component={AcercaDeScreen}
                options={{ title: 'Acerca de' }}
              />
            </PilaApp.Navigator>
          ) : (
            <PilaAuth.Navigator screenOptions={{ headerShown: false }}>
              <PilaAuth.Screen name="Login" component={LoginScreen} />
            </PilaAuth.Navigator>
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </RolContext.Provider>
  );
}

const st = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
