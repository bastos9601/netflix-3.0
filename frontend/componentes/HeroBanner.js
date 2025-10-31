import React from 'react';
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity } from 'react-native';
import { pressProps } from '../util/press';
import { Ionicons } from '@expo/vector-icons';

export default function HeroBanner({ item, onPlay, onMyList, onPressBanner }) {
  if (!item) return null;

  return (
    <View style={estilos.wrapper}>
      <View style={estilos.card}>
        <ImageBackground
          source={item.fondo ? { uri: item.fondo } : (item.poster ? { uri: item.poster } : undefined)}
          style={estilos.fondo}
          imageStyle={{ resizeMode: 'cover', borderRadius: 12 }}
        >
          {/* Área clicable sobre la imagen, sin bloquear botones */}
          <TouchableOpacity style={estilos.touchFill} {...pressProps(() => onPressBanner?.(item))} />
          <View style={estilos.overlay} pointerEvents="none" />
          <View style={estilos.contenido}>
            <Text style={estilos.titulo} numberOfLines={2}>{item.titulo}</Text>
            <View style={estilos.chips}>
              <Text style={estilos.chip}>Comedia física</Text>
              <Text style={estilos.punto}>•</Text>
              <Text style={estilos.chip}>Picante</Text>
              <Text style={estilos.punto}>•</Text>
              <Text style={estilos.chip}>Comedias de terror</Text>
              <Text style={estilos.punto}>•</Text>
              <Text style={estilos.chip}>Sátira</Text>
            </View>
            <View style={estilos.botones}>
              <TouchableOpacity style={[estilos.btn, estilos.btnPlay]} {...pressProps(() => onPlay?.(item))}>
                <Ionicons name="play" size={18} color="#000" />
                <Text style={[estilos.btnTxt, { color: '#000' }]}>Reproducir</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[estilos.btn, estilos.btnLista]} {...pressProps(() => onMyList?.(item))}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={estilos.btnTxt}>Mi lista</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  wrapper: { width: '100%', paddingHorizontal: 12, marginTop: 10 },
  card: { borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 6, backgroundColor: '#101010' },
  fondo: { width: '100%', aspectRatio: 2/3, justifyContent: 'flex-end' },
  touchFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 0 },
  contenido: { paddingHorizontal: 14, paddingBottom: 12, zIndex: 2 },
  titulo: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  chips: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' },
  chip: { color: '#ddd', fontSize: 12 },
  punto: { color: '#bbb', marginHorizontal: 6 },
  botones: { flexDirection: 'row', gap: 10 },
  btn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnPlay: { backgroundColor: '#fff' },
  btnLista: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  btnIcon: { fontSize: 14, color: '#fff' },
  btnTxt: { color: '#fff', fontWeight: '700' },
});
