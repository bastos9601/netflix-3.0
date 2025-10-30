import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, StatusBar, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BarraNavegacion from '../componentes/BarraNavegacion';

const { width } = Dimensions.get('window');

export default function Juegos({ onOpenBuscar }) {
  const [juegos, setJuegos] = useState([]);
  const [juegoDestacado, setJuegoDestacado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const juegosMock = [
    { id: 1, titulo: 'Stranger Things: 1984', descripcion: 'Juega como los personajes de Stranger Things en este emocionante juego de aventuras.', imagen: 'https://picsum.photos/seed/stranger-things/1200/675', categoria: 'Aventura', rating: 4.5, destacado: true },
    { id: 2, titulo: "The Queen's Gambit Chess", descripcion: 'Mejora tus habilidades de ajedrez con este juego inspirado en la serie.', imagen: 'https://picsum.photos/seed/queens-gambit/1200/675', categoria: 'Estrategia', rating: 4.8 },
    { id: 3, titulo: 'Money Heist: The Experience', descripcion: 'Planifica el atraco perfecto en este juego de estrategia.', imagen: 'https://picsum.photos/seed/money-heist/1200/675', categoria: 'Estrategia', rating: 4.3 },
    { id: 4, titulo: 'Squid Game: Challenge', descripcion: 'Sobrevive a los juegos mortales en esta experiencia inmersiva.', imagen: 'https://picsum.photos/seed/squid-game/1200/675', categoria: 'Supervivencia', rating: 4.6 },
    { id: 5, titulo: 'Bridgerton: Society', descripcion: 'Navega por la alta sociedad londinense en este juego de simulación.', imagen: 'https://picsum.photos/seed/bridgerton/1200/675', categoria: 'Simulación', rating: 4.2 },
    { id: 6, titulo: 'The Witcher: Monster Hunt', descripcion: 'Caza monstruos como Geralt en este juego de acción.', imagen: 'https://picsum.photos/seed/witcher/1200/675', categoria: 'Acción', rating: 4.7 },
  ];

  useEffect(() => {
    (async () => {
      try {
        setCargando(true);
        await new Promise((r) => setTimeout(r, 600));
        setJuegos(juegosMock);
        setJuegoDestacado(juegosMock.find((j) => j.destacado) || juegosMock[0]);
      } catch (e) {
        setError('Error al cargar los juegos');
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const jugarJuego = (juego) => {
    // pendiente: abrir detalle o iniciar
    console.log('Iniciando juego:', juego.titulo);
  };

  const renderJuegoItem = ({ item }) => (
    <TouchableOpacity style={estilos.juegoItem} onPress={() => jugarJuego(item)}>
      <Image source={{ uri: item.imagen }} style={estilos.juegoImagen} />
      <View style={estilos.juegoInfo}>
        <Text style={estilos.juegoTitulo} numberOfLines={1}>{item.titulo}</Text>
        <Text style={estilos.juegoCategoria}>{item.categoria}</Text>
        <View style={estilos.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={estilos.rating}>{item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (cargando) {
    return (
      <View style={estilos.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={estilos.loadingText}>Cargando juegos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={estilos.errorContainer}>
        <StatusBar barStyle="light-content" />
        <Text style={estilos.errorText}>{error}</Text>
        <TouchableOpacity style={estilos.retryButton} onPress={() => setCargando(true)}>
          <Text style={estilos.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <BarraNavegacion label="Juegos" onPressBuscar={onOpenBuscar} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        {/* Juego destacado */}
        {juegoDestacado && (
          <View style={estilos.destacadoCard}>
            <Image source={{ uri: juegoDestacado.imagen }} style={estilos.destacadoImg} />
            <View style={estilos.destacadoOverlay} />
            <View style={estilos.destacadoContenido}>
              <Text style={estilos.destacadoTitulo} numberOfLines={1}>{juegoDestacado.titulo}</Text>
              <Text style={estilos.destacadoDesc} numberOfLines={2}>{juegoDestacado.descripcion}</Text>
              <View style={estilos.destacadoBtns}>
                <TouchableOpacity style={[estilos.btn, estilos.btnPlay]} onPress={() => jugarJuego(juegoDestacado)}>
                  <Ionicons name="play" size={18} color="#000" />
                  <Text style={[estilos.btnTxt, { color: '#000' }]}>Jugar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[estilos.btn, estilos.btnLista]}>
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={estilos.btnTxt}>Mi lista</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Carrusel horizontal */}
        <Text style={estilos.seccionTitulo}>Juegos móviles</Text>
        <FlatList
          data={juegos}
          horizontal
          keyExtractor={(i) => String(i.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={estilos.carruselItem} onPress={() => jugarJuego(item)}>
              <Image source={{ uri: item.imagen }} style={estilos.carruselImg} />
            </TouchableOpacity>
          )}
        />

        {/* Lista vertical */}
        <Text style={estilos.seccionTitulo}>Todos los juegos</Text>
        <FlatList
          data={juegos}
          keyExtractor={(i) => `v-${i.id}`}
          scrollEnabled={false}
          renderItem={renderJuegoItem}
        />
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#141414' },
  loadingContainer: { flex: 1, backgroundColor: '#141414', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#fff', marginTop: 10 },
  errorContainer: { flex: 1, backgroundColor: '#141414', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#fff', marginBottom: 10 },
  retryButton: { backgroundColor: '#E50914', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  retryText: { color: '#fff', fontWeight: '700' },

  destacadoCard: { width: width - 24, height: (width - 24) * 0.6, marginHorizontal: 12, marginTop: 10, marginBottom: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: '#101010', elevation: 6 },
  destacadoImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  destacadoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  destacadoContenido: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  destacadoTitulo: { color: '#fff', fontSize: 20, fontWeight: '800' },
  destacadoDesc: { color: '#e5e5e5', marginTop: 6 },
  destacadoBtns: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnPlay: { backgroundColor: '#fff' },
  btnLista: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  btnTxt: { color: '#fff', fontWeight: '700' },

  seccionTitulo: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 12, marginVertical: 10 },
  carruselItem: { marginRight: 8 },
  carruselImg: { width: 140, height: 200, borderRadius: 8, backgroundColor: '#222' },

  juegoItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  juegoImagen: { width: 70, height: 98, borderRadius: 6, backgroundColor: '#222', marginRight: 12 },
  juegoInfo: { flex: 1 },
  juegoTitulo: { color: '#fff', fontWeight: '700' },
  juegoCategoria: { color: '#bbb', marginTop: 2 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  rating: { color: '#fff', marginLeft: 4 },
});
