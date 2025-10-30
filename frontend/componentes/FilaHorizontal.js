// Fila horizontal de pósters:
// Renderiza una lista horizontal de contenidos con imagen y callback.
import React from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';

export default function FilaHorizontal({ titulo, datos = [], onPressItem }) {
  return (
    <View style={estilos.contenedor}>
      {!!titulo && <Text style={estilos.titulo}>{titulo}</Text>}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={datos}
        keyExtractor={(i, idx) => `${i.tipo}-${i.id}-${idx}`}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={estilos.item} onPress={() => onPressItem?.(item)}>
            {item.poster ? (
              <Image source={{ uri: item.poster }} style={estilos.poster} />
            ) : (
              <View style={[estilos.poster, estilos.posterVacio]} />
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { marginTop: 10 },
  titulo: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 12, marginBottom: 8 },
  item: { marginRight: 8 },
  poster: { width: 120, height: 180, borderRadius: 6, backgroundColor: '#222' },
  posterVacio: { alignItems: 'center', justifyContent: 'center' },
});