import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const items = [
  { key: 'inicio', label: 'Inicio', iconName: 'home' },
  { key: 'juegos', label: 'Juegos', iconName: 'game-controller-outline' },
  { key: 'nuevos', label: 'Nuevos y popular', iconName: 'newspaper-outline' },
  { key: 'mi', label: 'Mi Netflix', iconName: 'person-circle' },
  { key: 'hugo', label: 'Hugo', iconName: 'person-outline' },
];

export default function BarraTabs({ activo = 'inicio', onCambiar }) {
  return (
    <View style={estilos.contenedor}>
      {items.map((it) => {
        const seleccionado = activo === it.key;
        return (
          <TouchableOpacity key={it.key} style={estilos.item} onPress={() => onCambiar?.(it.key)}>
            <Ionicons
              name={it.iconName}
              size={22}
              color={seleccionado ? '#fff' : '#8b8b8b'}
              style={{ marginBottom: 2 }}
            />
            <Text style={[estilos.texto, seleccionado ? estilos.sel : estilos.noSel]} numberOfLines={1}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    backgroundColor: '#0f0f0f',
    borderTopWidth: 0.5,
    borderTopColor: '#2a2a2a',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 6,
  },
  item: { alignItems: 'center', width: '25%' },
  texto: { fontSize: 11 },
  sel: { color: '#fff' },
  noSel: { color: '#8b8b8b' },
});