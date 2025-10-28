import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, Text, StatusBar, Dimensions, TouchableOpacity, FlatList, Image } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';

// Reproductor de video embebido
// Soporta URLs directas (mp4/m3u8). En web, HLS depende del navegador.
export default function ReproductorVideo({
  sourceUrl,
  poster,
  autoPlay = true,
  autoFullscreenOnLandscape = true,
  onClose,
  // Soporte de series
  episodes = [], // [{ numero, titulo, imagen }]
  currentEpisodeNumber,
  seasonNumber,
  onSelectEpisode,
}) {
  const videoRef = useRef(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const [originalOrientation, setOriginalOrientation] = useState(null);
  const [showEpisodes, setShowEpisodes] = useState(false);

  useEffect(() => {
    setCargando(true);
    setError(null);
  }, [sourceUrl]);

  // Forzar orientación horizontal al iniciar el reproductor
  useEffect(() => {
    const setupOrientation = async () => {
      try {
        // Guardar orientación original
        const current = await ScreenOrientation.getOrientationAsync();
        setOriginalOrientation(current);
        
        // Forzar orientación horizontal
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        StatusBar.setHidden(true, 'fade');
      } catch (error) {
        console.log('Error configurando orientación:', error);
      }
    };

    if (sourceUrl && Platform.OS !== 'web') {
      setupOrientation();
    }

    // Cleanup: restaurar orientación original al desmontar
    return () => {
      const cleanup = async () => {
        try {
          await ScreenOrientation.unlockAsync();
          StatusBar.setHidden(false, 'fade');
        } catch (error) {
          console.log('Error restaurando orientación:', error);
        }
      };
      
      if (Platform.OS !== 'web') {
        cleanup();
      }
    };
  }, [sourceUrl]);

  // Detectar orientación y alternar fullscreen en landscape
  useEffect(() => {
    let sub;
    const updateFromDims = () => {
      const { width, height } = Dimensions.get('window');
      const landscape = width > height;
      setIsLandscape(landscape);
    };
    updateFromDims();
    const dimsSub = Dimensions.addEventListener('change', updateFromDims);
    const subscribeOrientation = async () => {
      try {
        sub = await ScreenOrientation.addOrientationChangeListener(({ orientationInfo }) => {
          const o = orientationInfo.orientation;
          const landscape = o === ScreenOrientation.Orientation.LANDSCAPE_LEFT || o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;
          setIsLandscape(landscape);
        });
      } catch {}
    };
    subscribeOrientation();
    return () => {
      try { if (sub) ScreenOrientation.removeOrientationChangeListener(sub); } catch {}
      try { dimsSub?.remove?.(); } catch {}
      StatusBar.setHidden(false, 'fade');
    };
  }, []);

  useEffect(() => {
    if (!autoFullscreenOnLandscape) return;
    if (isLandscape) {
      StatusBar.setHidden(true, 'fade');
      // Intentar fullscreen nativo donde esté disponible
      if (Platform.OS !== 'web') {
        try { videoRef.current?.presentFullscreenPlayer?.(); } catch {}
      }
    } else {
      StatusBar.setHidden(false, 'fade');
      if (Platform.OS !== 'web') {
        try { videoRef.current?.dismissFullscreenPlayer?.(); } catch {}
      }
    }
  }, [isLandscape, autoFullscreenOnLandscape]);

  return (
    <View style={estilos.root}>
      {sourceUrl ? (
        <Video
          ref={videoRef}
          style={estilos.player}
          source={{ uri: sourceUrl }}
          useNativeControls
          shouldPlay={!!autoPlay}
          resizeMode={ResizeMode.CONTAIN}
          posterSource={poster ? { uri: poster } : undefined}
          onLoadStart={() => setCargando(true)}
          onReadyForDisplay={() => setCargando(false)}
          onError={(e) => {
            setError('No se pudo reproducir el video');
            setCargando(false);
          }}
        />
      ) : (
        <View style={estilos.fallback}><Text style={{ color: '#fff' }}>Sin fuente de video</Text></View>
      )}
      {/* Botones superiores */}
      <View style={estilos.topBar} pointerEvents="box-none">
        {!!onClose && (
          <TouchableOpacity style={estilos.iconBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        {Array.isArray(episodes) && episodes.length > 0 && (
          <TouchableOpacity style={estilos.iconBtn} onPress={() => setShowEpisodes((v) => !v)}>
            <Ionicons name="list" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {cargando && (
        <View style={estilos.overlayCenter}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      )}
      {!!error && (
        <View style={estilos.overlayBottom}><Text style={{ color: '#fff' }}>{error}</Text></View>
      )}

      {/* Panel de episodios */}
      {Array.isArray(episodes) && episodes.length > 0 && showEpisodes && (
        <View style={[estilos.episodesPanel, isLandscape ? estilos.episodesPanelLandscape : estilos.episodesPanelPortrait]}>
          <View style={estilos.epHeader}>
            <Text style={estilos.epHeaderTxt}>Episodios {seasonNumber ? `· T${seasonNumber}` : ''}</Text>
            <TouchableOpacity style={estilos.iconBtn} onPress={() => setShowEpisodes(false)}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={episodes}
            keyExtractor={(item, idx) => String(item.id || `${item.numero}-${idx}`)}
            renderItem={({ item }) => {
              const activo = Number(currentEpisodeNumber) === Number(item.numero);
              return (
                <TouchableOpacity
                  style={[estilos.epRow, activo && estilos.epRowActivo]}
                  onPress={() => {
                    setShowEpisodes(false);
                    onSelectEpisode && onSelectEpisode(item.numero);
                  }}
                >
                  {item.imagen ? (
                    <Image source={{ uri: item.imagen }} style={estilos.epThumb} />
                  ) : (
                    <View style={[estilos.epThumb, { backgroundColor: '#333' }]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[estilos.epTitulo, activo && { color: '#E50914' }]} numberOfLines={2}>
                      {item.numero}. {item.titulo || 'Episodio'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  player: { flex: 1, backgroundColor: '#000' },
  overlayCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  overlayBottom: { position: 'absolute', left: 12, right: 12, bottom: 16, alignItems: 'center' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { position: 'absolute', top: 8, left: 8, right: 8, zIndex: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: { backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  episodesPanel: { position: 'absolute', zIndex: 35, backgroundColor: 'rgba(0,0,0,0.9)', borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  episodesPanelLandscape: { top: 0, right: 0, bottom: 0, width: Math.min(360, Math.round(Dimensions.get('window').width * 0.42)) },
  episodesPanelPortrait: { left: 0, right: 0, bottom: 0, maxHeight: Math.round(Dimensions.get('window').height * 0.5) },
  epHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  epHeaderTxt: { color: '#fff', fontWeight: '800' },
  epRow: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 10 },
  epRowActivo: { backgroundColor: 'rgba(229,9,20,0.08)' },
  epThumb: { width: 96, height: 54, borderRadius: 6, marginRight: 6, backgroundColor: '#222' },
  epTitulo: { color: '#fff', fontWeight: '700' },
});