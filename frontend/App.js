// Punto de entrada del frontend:
// Monta el proveedor de autenticación y el navegador principal.
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { setAudioModeAsync } from 'expo-audio';
import NavegadorPrincipal from './navegacion/NavegadorPrincipal';
import { ProveedorAutenticacion } from './contextos/ContextoAutenticacion';

export default function App() {
  useEffect(() => {
    // Configurar modo de audio para asegurar reproducción de sonido
    const setupAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true, // iOS: reproducir aunque el switch esté en silencio
          shouldPlayInBackground: true, // permite continuar si la app pierde foco
          interruptionMode: 'mixWithOthers', // iOS: mezclar con otros audios
          interruptionModeAndroid: 'duckOthers', // Android: bajar volumen de otros
        });
      } catch (e) {
        console.log('No se pudo configurar el modo de audio:', e);
      }
    };
    setupAudio();
  }, []);
  return (
    <ProveedorAutenticacion>
      <View style={estilos.app}>
        <NavegadorPrincipal />
        <StatusBar style="light" />
      </View>
    </ProveedorAutenticacion>
  );
}

const estilos = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#141414',
  },
});
