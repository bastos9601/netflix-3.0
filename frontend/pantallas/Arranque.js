import React, { useEffect, useRef } from 'react';
import { View, Animated, ActivityIndicator, StyleSheet, Text } from 'react-native';

export default function Arranque() {
  const opacidad = useRef(new Animated.Value(0)).current;
  const escala = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidad, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(escala, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
    ]).start();
  }, [opacidad, escala]);

  return (
    <View style={estilos.contenedor}>
      <Animated.Text style={[estilos.logo, { opacity: opacidad, transform: [{ scale: escala }] }]}>
        NETFLIX
      </Animated.Text>
      <View style={{ height: 24 }} />
      <ActivityIndicator size="large" color="#E50914" />
      <Text style={estilos.texto}>Cargando...</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    color: '#E50914',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 2,
  },
  texto: {
    color: '#E50914',
    marginTop: 12,
  },
});