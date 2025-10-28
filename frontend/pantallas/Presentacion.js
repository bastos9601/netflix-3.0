import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, SafeAreaView, Image, Platform, StatusBar } from 'react-native';
import { obtenerPopulares } from '../servicios/api';

const { width, height } = Dimensions.get('window');
const ALTURA_FONDO = Math.min(height * 1.1, width * 1.5);
const MARGEN_HEADER = Platform.OS === 'android' ? Math.max((StatusBar?.currentHeight || 24) + 6, 32) : 32;

const DIAPOSITIVAS = [
  {
    id: '1',
    titulo: 'Series y películas ilimitadas y mucho más',
    subtitulo: 'Disfruta donde quieras. Cancela cuando quieras.',
  },
  {
    id: '2',
    titulo: 'Hay un plan para cada fan',
    subtitulo: 'Planes desde S/. 28.90.',
  },
  {
    id: '3',
    titulo: 'Cancela online cuando quieras',
    subtitulo: 'Suscríbete hoy. ¿Para qué esperar?',
  },
  {
    id: '4',
    titulo: 'Disfruta en todas partes',
    subtitulo: 'Streaming en tu móvil, tableta, ordenador y televisor.',
  },
];

export default function Presentacion({ onFinalizar, onComienzaYa, onIniciarSesion }) {
  const refLista = useRef(null);
  const [indice, setIndice] = useState(0);
  const [fondos, setFondos] = useState([]);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const datos = await obtenerPopulares({ tipo: 'all', periodo: 'week' });
        const posters = datos.filter((d) => d.poster).slice(0, 9).map((d) => d.poster);
        if (activo) setFondos(posters);
      } catch (e) {
        // Si el backend no está disponible, dejamos sin fondos (fallback)
        if (activo) setFondos([]);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  const renderItem = ({ item, index }) => (
    <SafeAreaView style={[estilos.pantalla, { width }]}> 
      {/* Fondo específico por diapositiva */}
      <View style={[estilos.fondo, { height: ALTURA_FONDO }]}>
        {(() => {
          const uri = fondos.length ? fondos[index % fondos.length] : null;
          if (uri) {
            return <Image source={{ uri }} style={estilos.fondoImagen} resizeMode="cover" />;
          }
          return <View style={[estilos.fondoImagen, { backgroundColor: '#1a1a1a' }]} />;
        })()}
        <View style={estilos.overlay} />
      </View>

      <View style={estilos.header}>
        <Text style={estilos.logoN}>N</Text>
        <View style={estilos.headerLinks}>
          <Text style={estilos.headerLink}>PRIVACIDAD</Text>
          <TouchableOpacity onPress={() => onIniciarSesion?.()}>
            <Text style={estilos.headerLink}>INICIAR SESIÓN</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={estilos.ilustracion} />

      <View style={estilos.textos}>
        <Text style={estilos.titulo}>{item.titulo}</Text>
        <Text style={estilos.subtitulo}>{item.subtitulo}</Text>
      </View>

      <View style={estilos.indicadores}>
        {DIAPOSITIVAS.map((d, i) => (
          <View key={d.id} style={[estilos.punto, i === indice && estilos.puntoActivo]} />
        ))}
      </View>

      <TouchableOpacity style={estilos.boton} onPress={() => onComienzaYa?.()}>
        <Text style={estilos.botonTexto}>Comienza ya</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  return (
    <View style={estilos.contenedor}>
      <FlatList
        ref={refLista}
        data={DIAPOSITIVAS}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndice(idx);
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#141414' },
  pantalla: { flex: 1, height, paddingHorizontal: 16 },
  fondo: { position: 'absolute', top: 0, left: 0, right: 0 },
  fondoImagen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,20,20,0.65)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: MARGEN_HEADER },
  logoN: { color: '#E50914', fontSize: 22, fontWeight: '900' },
  headerLinks: { flexDirection: 'row', alignItems: 'center' },
  headerLink: { color: '#bbb', fontSize: 12, marginLeft: 12 },
  ilustracion: { flex: 1 },
  textos: { paddingHorizontal: 16, paddingBottom: 40 },
  titulo: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  subtitulo: { color: '#ddd', marginTop: 8, textAlign: 'center' },
  indicadores: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#666', marginHorizontal: 6 },
  puntoActivo: { backgroundColor: '#fff' },
  boton: { position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: '#E50914', paddingVertical: 12, borderRadius: 6 },
  botonTexto: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});