import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const items = [
  { key: 'inicio', label: 'Inicio', icon: '🏠' },
  { key: 'juegos', label: 'Juegos', icon: '🎮' },
  { key: 'nuevos', label: 'Nuevos y popular', icon: '📰' },
  { key: 'mi', label: 'Mi Netflix', icon: '👤' },
];

export default function BarraTabs({ activo = 'inicio', onCambiar }) {
  return (
    <View style={estilos.contenedor}>
      {items.map((it) => {
        const seleccionado = activo === it.key;
        return (
          <TouchableOpacity key={it.key} style={estilos.item} onPress={() => onCambiar?.(it.key)}>
            <Text style={[estilos.icono, seleccionado ? estilos.sel : estilos.noSel]}>{it.icon}</Text>
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
  icono: { fontSize: 18, marginBottom: 2 },
  texto: { fontSize: 11 },
  sel: { color: '#fff' },
  noSel: { color: '#8b8b8b' },
});