// Punto de entrada del frontend:
// Monta el proveedor de autenticación y el navegador principal.
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import NavegadorPrincipal from './navegacion/NavegadorPrincipal';
import { ProveedorAutenticacion } from './contextos/ContextoAutenticacion';

export default function App() {
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
