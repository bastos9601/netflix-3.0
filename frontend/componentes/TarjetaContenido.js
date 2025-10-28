import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function TarjetaContenido({ item, onPress }) {
  return (
    <TouchableOpacity style={estilos.item} onPress={() => onPress?.(item)}>
      {item.poster ? (
        <Image source={{ uri: item.poster }} style={estilos.poster} />
      ) : (
        <View style={[estilos.poster, estilos.posterVacio]} />
      )}
      <Text style={estilos.titulo} numberOfLines={1}>{item.titulo}</Text>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  item: { margin: 6, width: '30%' },
  poster: { width: '100%', aspectRatio: 2/3, borderRadius: 6, backgroundColor: '#222' },
  posterVacio: { alignItems: 'center', justifyContent: 'center' },
  titulo: { color: '#ccc', fontSize: 12, marginTop: 6 },
});