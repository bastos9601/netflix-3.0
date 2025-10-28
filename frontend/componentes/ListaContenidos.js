import React from 'react';
import { FlatList } from 'react-native';
import TarjetaContenido from './TarjetaContenido';

export default function ListaContenidos({ datos, onPressItem }) {
  return (
    <FlatList
      data={datos}
      keyExtractor={(i) => `${i.tipo}-${i.id}`}
      renderItem={({ item }) => <TarjetaContenido item={item} onPress={onPressItem} />}
      numColumns={3}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
}