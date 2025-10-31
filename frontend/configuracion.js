// Configuración del frontend
// Resuelve la BASE_URL del backend según plataforma/entorno (Expo)
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Determina el host del backend en desarrollo y dispositivos
function obtenerHostLocal() {
  // 1. Permitir override por variable pública de Expo (máxima prioridad)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  // 2. En web siempre usar localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }

  // 3. Para móvil, intentar deducir IP desde la URL de desarrollo de Expo
  try {
    const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest?.debuggerHost || Constants?.manifest?.hostUri; // Obtiene host de Expo
    if (hostUri) {
      const host = hostUri.split(':')[0]; // Extrae hostname
      // Validar que no sea localhost (que no funcionaría en móvil real)
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:3000`;
      }
    }
  } catch {}

  // 4. Ajuste para emulador Android
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  // 5. Fallback: usar IP pública/externa si está disponible
  // Nota: En producción deberías usar tu dominio/IP real del servidor
  // Ejemplo: return 'https://tu-servidor.com:3000';
  
  // 6. Último recurso: localhost (solo funcionará en emulador/web)
  return 'http://localhost:3000';
}

// Objeto de configuración público para el resto de la app
const CONFIGURACION = {
  BASE_URL: obtenerHostLocal(), // URL base del backend
};

export default CONFIGURACION;
