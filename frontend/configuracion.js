// Configuración del frontend:
// Resuelve la BASE_URL del backend según plataforma/entorno (Expo).
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function obtenerHostLocal() {
  // Permitir override por variable pública de Expo
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  // Intentar deducir IP desde la URL de desarrollo de Expo
  try {
    const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest?.debuggerHost || Constants?.manifest?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      return `http://${host}:3000`;
    }
  } catch {}

  // Ajuste para emulador Android
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  // Web / iOS por defecto
  return 'http://localhost:3000';
}

const CONFIGURACION = {
  BASE_URL: obtenerHostLocal(),
};

export default CONFIGURACION;