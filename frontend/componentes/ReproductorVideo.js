/**
 * Componente: ReproductorVideo
 *
 * Propósito
 * - Reproduce video embebido desde una URL directa (mp4/m3u8/HLS).
 * - Ofrece controles nativos y gestión de orientación (bloqueo en horizontal).
 * - Puede entrar/salir de modo fullscreen automáticamente al rotar a landscape.
 * - Incluye un panel opcional de episodios para contenido tipo serie.
 *
 * Uso
 * - Proveer `sourceUrl` con la fuente del video y, opcionalmente, `poster`.
 * - Para series, pasar `episodes`, `seasonNumber` y `currentEpisodeNumber`.
 * - Maneja estados de carga y errores mostrando overlays.
 *
 * Props clave
 * - `sourceUrl`: string URL del video (mp4/m3u8)
 * - `poster`: string URL de imagen de portada opcional
 * - `autoPlay`: boolean, auto iniciar reproducción
 * - `autoFullscreenOnLandscape`: boolean, activar fullscreen al rotar
 * - `onClose`: función de callback para cerrar el reproductor
 * - `episodes`: array con episodios { numero, titulo, imagen }
 * - `currentEpisodeNumber`: número del episodio activo
 * - `seasonNumber`: número de temporada actual
 * - `onSelectEpisode`: callback al seleccionar episodio
 */
// Importa React y hooks necesarios para referencias, efectos y estado
import React, { useRef, useEffect, useState } from 'react';
// Importa componentes y utilidades de UI de React Native
import { View, StyleSheet, ActivityIndicator, Platform, Text, StatusBar, Dimensions, TouchableOpacity, FlatList, Image } from 'react-native';
// Importa WebView para renderizar video HTML en web
import { WebView } from 'react-native-webview';
// Importa el hook y la vista del reproductor de video de Expo
import { useVideoPlayer, VideoView } from 'expo-video';
// Importa utilidades de eventos de Expo para escuchar cambios del player
import { useEvent } from 'expo';
// Importa control de orientación de pantalla para bloquear landscape
import * as ScreenOrientation from 'expo-screen-orientation';
// Importa íconos de Ionicons para botones de control
import { Ionicons } from '@expo/vector-icons';

// Reproductor de video embebido
// Soporta URLs directas (mp4/m3u8). En web, HLS depende del navegador.
// Componente ReproductorVideo con soporte para episodios
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
  // Referencia al componente de video para acciones nativas (fullscreen)
  const videoRef = useRef(null);
  // Estado de carga (spinner/overlay)
  const [cargando, setCargando] = useState(true);
  // Estado de error de reproducción
  const [error, setError] = useState(null);
  // Bandera de si la pantalla está en landscape
  const [isLandscape, setIsLandscape] = useState(false);
  // Guardado de orientación original (informativo)
  const [originalOrientation, setOriginalOrientation] = useState(null);
  // Control para mostrar/ocultar panel de episodios
  const [showEpisodes, setShowEpisodes] = useState(false);
  // Preferencia de mute: en la pantalla de video NO debe estar silenciado
  const [mutedPref, setMutedPref] = useState(false);

  // Inicializar el reproductor con expo-video
  // Inicializa el player con la fuente actual y configura propiedades
  const player = useVideoPlayer(sourceUrl || null, (p) => {
    p.loop = false; // Evita bucle por defecto
    // Configurar mute/volumen según preferencia actual
    try { p.muted = !!mutedPref; } catch {}
    try { p.volume = mutedPref ? 0 : 1; } catch {}
    if (autoPlay) {
      try { p.play(); } catch {}
    }
  });

  // Escuchar estado de reproducción y errores
  // Escucha cambios de reproducción (play/pause)
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  // Escucha cambios de estado y errores del reproductor
  const { status, error: playerError } = useEvent(player, 'statusChange', { status: player.status, error: player.error });

  // Reinicia estados de carga/error al cambiar la fuente de video
  useEffect(() => {
    setCargando(true);
    setError(null);
    // Al cambiar de fuente, asegurar que el estado de mute se aplica
    try {
      player.muted = !!mutedPref;
      player.volume = mutedPref ? 0 : 1;
    } catch {}
  }, [sourceUrl]);

  // Si el reproductor reporta error, actualiza el estado de error
  useEffect(() => {
    if (playerError) {
      setError('No se pudo reproducir el video');
      setCargando(false);
    }
  }, [playerError]);

  // Cuando el reproductor está listo o está reproduciendo, quita el overlay de carga
  useEffect(() => {
    if (status === 'ready' || isPlaying) {
      setCargando(false);
    }
  }, [status, isPlaying]);

  // Aplicar cambios de mute preferido al reproductor cuando se togglean
  useEffect(() => {
    try {
      player.muted = !!mutedPref;
      player.volume = mutedPref ? 0 : 1;
    } catch {}
  }, [mutedPref]);

  // (revert) La actualización de fuente se maneja con remount usando key para estabilidad

  // Forzar orientación horizontal al iniciar el reproductor
  // Gestiona la orientación: fuerza landscape al entrar y restaura al salir
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
  // Suscribe cambios de dimensiones y orientación para detectar landscape
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

  // Alterna fullscreen según orientación si la opción está habilitada
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
        Platform.OS === 'web' ? (
          // En web, usar WebView con video HTML para maximizar compatibilidad con streams
          <WebView
            key={sourceUrl || 'sin-fuente'}
            style={{ flex: 1, backgroundColor: '#000' }}
            source={{
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { margin: 0; padding: 0; background: #000; }
                    video { width: 100%; height: 100vh; object-fit: contain; }
                  </style>
                </head>
                <body>
                  <video 
                    src="${sourceUrl}" 
                    ${autoPlay ? 'autoplay' : ''} 
                    controls 
                    preload="metadata"
                  ></video>
                </body>
                </html>
              `
            }}
            allowsFullscreenVideo={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        ) : (
          <VideoView
            ref={videoRef}
            // Forzar remount cuando cambia la fuente para evitar estados atascados
            key={sourceUrl || 'sin-fuente'}
            style={estilos.player}
            player={player}
            allowsFullscreen
            allowsPictureInPicture
            contentFit="contain"
          />
        )
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
        {Platform.OS !== 'web' && (
          <>
            <TouchableOpacity
              style={estilos.iconBtn}
              onPress={() => {
                try {
                  const playingNow = !!player?.playing;
                  if (playingNow) { player.pause(); } else { player.play(); }
                } catch {}
              }}
            >
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color="#fff" />
            </TouchableOpacity>
            {/* Toggle de mute para móvil */}
            <TouchableOpacity
              style={estilos.iconBtn}
              onPress={() => {
                setMutedPref((m) => !m);
              }}
            >
              <Ionicons name={mutedPref ? 'volume-mute' : 'volume-high'} size={20} color="#fff" />
            </TouchableOpacity>
          </>
        )}
        {Array.isArray(episodes) && episodes.length > 0 && (
          <TouchableOpacity style={estilos.iconBtn} onPress={() => setShowEpisodes((v) => !v)}>
            {/* icono hamburguesa */}
            <Ionicons name="list" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {cargando && (
        <View style={estilos.overlayCenter}>
          {poster ? (
            <Image source={{ uri: poster }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <ActivityIndicator size="large" color="#E50914" />
          )}
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

// Hoja de estilos del reproductor y panel de episodios
const estilos = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' }, // Contenedor raíz
  player: { flex: 1, backgroundColor: '#000' }, // Área del video
  overlayCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }, // Overlay centrado
  overlayBottom: { position: 'absolute', left: 12, right: 12, bottom: 16, alignItems: 'center' }, // Overlay inferior
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' }, // Vista de fallback cuando no hay fuente
  topBar: { position: 'absolute', top: 8, left: 8, right: 8, zIndex: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, // Barra superior
  iconBtn: { backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 }, // Botones de icono
  episodesPanel: { position: 'absolute', zIndex: 35, backgroundColor: 'rgba(0,0,0,0.9)', borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }, // Panel episodios base
  episodesPanelLandscape: { top: 0, right: 0, bottom: 0, width: Math.min(360, Math.round(Dimensions.get('window').width * 0.42)) }, // Panel para landscape
  episodesPanelPortrait: { left: 0, right: 0, bottom: 0, maxHeight: Math.round(Dimensions.get('window').height * 0.5) }, // Panel para portrait
  epHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }, // Cabecera del panel
  epHeaderTxt: { color: '#fff', fontWeight: '800' }, // Texto cabecera
  epRow: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 10 }, // Fila episodio
  epRowActivo: { backgroundColor: 'rgba(229,9,20,0.08)' }, // Resaltado episodio activo
  epThumb: { width: 96, height: 54, borderRadius: 6, marginRight: 6, backgroundColor: '#222' }, // Miniatura episodio
  epTitulo: { color: '#fff', fontWeight: '700' }, // Título episodio
});
