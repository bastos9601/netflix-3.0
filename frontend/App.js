// Punto de entrada del frontend
// Importa la barra de estado de Expo para controlar su estilo
import { StatusBar } from 'expo-status-bar';
// Importa utilidades de estilos y contenedores de React Native
import { StyleSheet, View } from 'react-native';
// Importa el hook useEffect para ejecutar efectos al montar el componente
import { useEffect } from 'react';
// Importa el módulo de audio de Expo para configurar reproducción de sonido
import { Audio } from 'expo-av';
// Importa el navegador principal que gestiona el flujo de pantallas
import NavegadorPrincipal from './navegacion/NavegadorPrincipal';
// Importa el proveedor de autenticación que expone el contexto a toda la app
import { ProveedorAutenticacion } from './contextos/ContextoAutenticacion';

// Componente principal de la aplicación
export default function App() {
  useEffect(() => {
    // Configurar modo de audio para asegurar que el sonido se reproduzca correctamente
    const setupAudio = async () => {
      try {
        // Configura el modo de audio para iOS y Android, permitiendo reproducción en silencio y mezcla con otras apps
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true, // iOS: permite reproducir aunque el dispositivo esté en modo silencio
          staysActiveInBackground: true, // Mantiene el audio activo en segundo plano
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS, // Mezcla con otros audios en iOS
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS, // Atenúa otros audios en Android
          shouldDuckAndroid: true, // Android: habilita el ducking
        });
        // Habilita globalmente el subsistema de audio de Expo
        await Audio.setIsEnabledAsync(true);
      } catch (e) {
        // Registra errores de configuración de audio para diagnóstico
        console.log('No se pudo configurar el modo de audio:', e);
      }
    };
    // Ejecuta la rutina de configuración de audio al montar el componente
    setupAudio();
  }, []);
  return (
    // Envuelve la app con el proveedor de autenticación
    <ProveedorAutenticacion>
      {/* Contenedor principal con estilo global oscuro */}
      <View style={estilos.app}>
        {/* Componente que controla la navegación y pantallas */}
        <NavegadorPrincipal />
        {/* Barra de estado clara sobre el fondo oscuro */}
        <StatusBar style="light" />
      </View>
    </ProveedorAutenticacion>
  );
}

// Hoja de estilos de la app
const estilos = StyleSheet.create({
  // Estilo del contenedor raíz
  app: {
    flex: 1, // Ocupa todo el alto disponible
    backgroundColor: '#141414', // Color de fondo tipo Netflix
  },
});
