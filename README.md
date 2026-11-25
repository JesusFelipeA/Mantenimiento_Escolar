# Mantenimiento Escolar

Aplicación móvil (React Native CLI 0.88 + TypeScript) para que estudiantes y personal administrativo registren reportes de mantenimiento de las instalaciones y consulten su estado. Usa **Supabase** como servicio en la nube (autenticación, base de datos PostgreSQL con Row Level Security y almacenamiento privado de fotos).

| Funcionalidad | Dónde está |
| --- | --- |
| Inicio de sesión | `src/screens/LoginScreen.tsx`, `src/services/auth.ts` |
| Registro de reportes | `src/screens/NuevoReporteScreen.tsx`, `src/services/reportes.ts` |
| Captura y adjunto de fotografías | `react-native-image-picker` (cámara o selector de fotos del sistema) |
| Ubicación GPS | `@react-native-community/geolocation`, `src/services/ubicacion.ts` |
| Envío y consulta en la nube | Supabase (`src/services/supabase.ts`) |
| Estado de los reportes | Lista con filtros por estado y detalle con progreso |

Datos de la app: `applicationId com.mantenimientoescolar`, versión **1.0.0 (1)**, Android 7.0+ (API 24, objetivo 36).

## 1. Requisitos

- Node.js 22.11 o superior
- JDK 17 y Android SDK (Android Studio)
- Un teléfono Android con depuración USB o un emulador

## 2. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta completo `supabase/schema.sql`. Crea la tabla `reportes`, sus políticas de seguridad y el bucket privado `evidencias`.
3. En **Authentication → Users → Add user**, crea los usuarios de prueba (correo y contraseña, marcando *Auto Confirm User*).
4. En **Project Settings → API**, copia la *Project URL* y la *anon public key* a `src/config/env.ts`.

### Cuenta de personal de mantenimiento (administrador)

1. Crea la cuenta en **Authentication → Users → Add user** (por ejemplo `admin@escuela.edu.mx`).
2. Abre `supabase/admin.sql`, cambia el correo de la sección 5 por el de esa cuenta y ejecútalo completo en **SQL Editor**.

Con esa cuenta, la app muestra **Todos los reportes** con el correo de quien los registró, y en el detalle aparecen botones para cambiar el estado (Pendiente, En proceso, Atendido). Los usuarios normales solo ven sus propios reportes y no pueden cambiar el estado: lo impiden las políticas de RLS y el permiso `UPDATE` limitado a la columna `estado`.

Para dar el rol a otra cuenta, repite el `insert` de la sección 5 con su correo.

## 3. Ejecutar en modo Debug

```bash
npm install
npm start            # terminal 1: Metro
npm run android      # terminal 2: compila e instala la versión Debug
```

Logs para diagnóstico:

```bash
adb logcat *:S ReactNative:V ReactNativeJS:V
```

Pruebas automáticas, tipos y lint:

```bash
npm test
npm run typecheck
npm run lint
```

## 4. Versión de distribución (Release)

### 4.1 Crear la llave de firma (una sola vez)

```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore $HOME\llaves\mantenimiento-escolar.keystore `
        -alias mantenimiento-escolar -keyalg RSA -keysize 2048 -validity 10000
```

Guarda la llave y sus contraseñas: sin ellas no se pueden publicar actualizaciones.

### 4.2 Registrar la llave fuera del repositorio

En `%USERPROFILE%\.gradle\gradle.properties`:

```properties
ME_UPLOAD_STORE_FILE=C:/Users/TU_USUARIO/llaves/mantenimiento-escolar.keystore
ME_UPLOAD_STORE_PASSWORD=********
ME_UPLOAD_KEY_ALIAS=mantenimiento-escolar
ME_UPLOAD_KEY_PASSWORD=********
```

Si falta, Gradle avisa y firma con la llave de depuración.

### 4.3 Compilar

```bash
npm run apk   # android/app/build/outputs/apk/release/app-release.apk  (instalación directa / Firebase)
npm run aab   # android/app/build/outputs/bundle/release/app-release.aab (Google Play)
```

Verificar la firma:

```bash
apksigner verify --verbose --print-certs android/app/build/outputs/apk/release/app-release.apk
```

Antes de cada nueva versión sube `versionCode` y `versionName` en `android/app/build.gradle`, `version` en `package.json` y `src/version.ts`. `npm test` falla si no coinciden.

## 5. Distribución con Firebase App Distribution

1. En [console.firebase.google.com](https://console.firebase.google.com) crea un proyecto y registra una app Android con el paquete `com.mantenimientoescolar`. No hace falta agregar el SDK de Firebase.
2. Abre **App Distribution → Comenzar**, sube `app-release.apk` y comprueba que detecte la versión 1.0.0 (1).
3. En **Testers y grupos** crea un grupo y agrega los correos de los verificadores.
4. Escribe las notas de la versión y pulsa **Distribuir**. Opcional: crea un **enlace de invitación**.
5. El verificador acepta la invitación desde su teléfono, descarga el APK e instala la app.

## 6. Permisos

| Permiso | Uso | Cuándo se pide |
| --- | --- | --- |
| `INTERNET` | Comunicación HTTPS con Supabase | Al instalar (permiso normal) |
| `CAMERA` | Fotografía de evidencia | Al tocar "Tomar foto" |
| `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` | Coordenadas del reporte | Al tocar "Obtener" |
| Fotos | Ninguno: se usa el selector de fotos del sistema | — |

Si el usuario rechaza un permiso la app sigue funcionando: sin cámara puede elegir de la galería o enviar sin foto, y sin ubicación escribe el edificio o aula. Si el permiso quedó bloqueado, la app ofrece abrir Ajustes. Los permisos de almacenamiento, audio y ubicación en segundo plano se eliminan del manifiesto final con `tools:node="remove"`.

Ver también [PRIVACIDAD.md](PRIVACIDAD.md).
