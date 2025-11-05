// Punto de entrada del frontend
// Importa la barra de estado de Expo para controlar su estilo
import { StatusBar } from 'expo-status-bar';
// Importa utilidades de estilos y contenedores de React Native
import { StyleSheet, View } from 'react-native';
// Importa el hook useEffect para ejecutar efectos al montar el componente
import { useEffect } from 'react';
// Importa el módulo de audio moderno de Expo para configurar reproducción de sonido
import { Audio } from 'expo-audio';
import { Platform } from 'react-native';
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
        // Configuración por plataforma para evitar valores inválidos en SDK recientes
        if (Platform.OS === 'ios') {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            // Evitar establecer interruptionModeIOS si no es compatible
          });
        } else if (Platform.OS === 'android') {
          await Audio.setAudioModeAsync({
            shouldDuckAndroid: true,
            staysActiveInBackground: false,
            // Evitar interruptionModeAndroid si la librería no lo soporta
          });
        } else {
          // En web no hace falta configurar el modo de audio
        }
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
