// Selector de perfil:
// Placeholder para escoger perfil activo en la app.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SelectorPerfil() {
  return (
    <View style={estilos.contenedor}>
      <Text style={{ color: '#fff' }}>Selector de perfil (pendiente)</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { padding: 12 },
});