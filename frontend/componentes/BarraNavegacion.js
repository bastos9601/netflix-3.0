import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BarraNavegacion({ label = 'Inicio', onPressBuscar, onPressDescargas }) {
  return (
    <View style={estilos.barra}>
      {/* Logo Netflix */}
      <View style={estilos.logoContainer}>
        <Text style={estilos.logo}>N</Text>
        <Text style={estilos.inicio}>{label}</Text>
      </View>
      
      {/* Botones derecha */}
      <View style={estilos.botonesContainer}>
        {/* Botón descarga */}
        <TouchableOpacity style={estilos.boton} onPress={onPressDescargas}>
          <Ionicons name="download-outline" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Botón búsqueda */}
        <TouchableOpacity style={estilos.boton} onPress={onPressBuscar}>
          <Ionicons name="search" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: { 
    paddingTop: 40, 
    paddingBottom: 12, 
    backgroundColor: '#141414', 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  logoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: { 
    color: '#E50914', 
    fontSize: 28, 
    fontWeight: 'bold',
    fontFamily: 'Arial'
  },
  botonesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boton: {
    marginLeft: 20,
    padding: 4,
  },
  // Iconos se manejan con Ionicons
  inicio: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 12,
  },
});