import { guardarCalificacion } from '../servicios/api';
/**
 * Pantalla: DetalleContenido
 *
 * Propósito
 * - Muestra la ficha detallada de una película o serie.
 * - Presenta portada, metadatos, descripción y acciones (reproducir, descargar, mi lista).
 * - Integra reproductores (Video directo, YouTube, Vimeo) y panel de episodios para series.
 * - Carga similares y verifica/gestiona el estado en "Mi Lista" mediante la API.
 *
 * Uso
 * - Recibe `item` con la información básica (id, tipo, título, poster/fondo).
 * - Invoca API para detalles de series (temporadas/episodios) y videos.
 * - `onCerrar` permite volver/cerrar el overlay de detalle.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, StatusBar, ActivityIndicator, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from 'react-native';
import ReproductorVideo from '../componentes/ReproductorVideo';
import ReproductorTrailerWeb from '../componentes/ReproductorTrailerWeb';
// Eliminado el uso de reproductores específicos de YouTube/Vimeo para unificar lógica
import FilaHorizontal from '../componentes/FilaHorizontal';
import { obtenerPopulares, agregarAMiLista, quitarDeMiLista, verificarEnMiLista, obtenerDetallesSerie, obtenerEpisodiosTemporada, obtenerVideosContenido, obtenerFuentePeliculaLocal, obtenerFuenteSerieLocal, obtenerCalificaciones, eliminarCalificacion } from '../servicios/api';
import { useAutenticacion } from '../contextos/ContextoAutenticacion';
import CONFIGURACION from '../configuracion';

const { width } = Dimensions.get('window');

export default function DetalleContenido({ item, onCerrar }) {
  // Componente de video compatible con web y móvil, con control de mute
  const ComponenteVideo = ({ uri, style, onLoadEnd, muted = true }) => {
    if (Platform.OS === 'web') {
      const sep = uri.includes('?') ? '&' : '?';
      // En web evitamos parámetros que pueden causar abortos por política de origen
      const finalUri = `${uri}${sep}autoplay=1&mute=${muted ? 1 : 0}`;
      return (
        <iframe
          src={finalUri}
          style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#000' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          // Usar la política por defecto del navegador; evita bloqueos innecesarios
          allowFullScreen
          onLoad={onLoadEnd}
        />
      );
    } else {
      const sep = uri.includes('?') ? '&' : '?';
      const finalUri = `${uri}${sep}autoplay=1${muted ? '&mute=1' : ''}`;
      const injectedJavaScript = `
        (function() {
          let videoStarted = false;
          function setupVideo(video) {
            try {
              video.muted = ${muted ? 'true' : 'false'};
              video.volume = ${muted ? '0' : '1.0'};
              if (${muted ? 'true' : 'false'}) {
                video.setAttribute('muted', 'true');
                video.setAttribute('autoplay', 'muted');
              } else {
                video.removeAttribute('muted');
              }
            } catch (e) {}
            ['play', 'playing', 'loadstart'].forEach(eventType => {
              video.addEventListener(eventType, function() {
                if (!videoStarted) {
                  videoStarted = true;
                  window.ReactNativeWebView.postMessage('video_started');
                }
              });
            });
          }
          const videos = document.querySelectorAll('video');
          videos.forEach(setupVideo);
          const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
              mutation.addedNodes.forEach(function(node) {
                if (node.tagName === 'VIDEO') {
                  setupVideo(node);
                } else if (node.querySelectorAll) {
                  const newVideos = node.querySelectorAll('video');
                  newVideos.forEach(setupVideo);
                }
              });
            });
          });
          observer.observe(document.body, { childList: true, subtree: true });
          const originalPlay = HTMLVideoElement.prototype.play;
          HTMLVideoElement.prototype.play = function() {
            try {
              this.muted = ${muted ? 'true' : 'false'};
              this.volume = ${muted ? '0' : '1.0'};
            } catch (e) {}
            if (!videoStarted) {
              videoStarted = true;
              window.ReactNativeWebView.postMessage('video_started');
            }
            return originalPlay.call(this);
          };
          document.addEventListener('click', function(e) {
            const target = e.target;
            if (target.closest('[aria-label*="play"]') ||
                target.closest('.play-button') ||
                target.closest('[class*="play"]') ||
                target.tagName === 'VIDEO') {
              setTimeout(() => {
                if (!videoStarted) {
                  videoStarted = true;
                  window.ReactNativeWebView.postMessage('video_started');
                }
              }, 100);
            }
          });
        })();
        true;
      `;
      return (
        <WebView
          source={{ uri: finalUri }}
          style={style}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={["*"]}
          mixedContentMode="always"
          allowsFullscreenVideo
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={() => true}
          userAgent={
            'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
          }
          injectedJavaScript={injectedJavaScript}
          onLoadEnd={onLoadEnd}
          onMessage={(event) => {
            if (event?.nativeEvent?.data === 'video_started') {
              manejarInicioVideo();
            }
          }}
        />
      );
    }
  };

  const manejarInicioVideo = () => {
    // Lógica de inicio del video: no modifica diseño, solo señaliza
    // Puedes conectar aquí cualquier estado/telemetría si lo deseas
  };
  const [itemActual, setItemActual] = useState(item);
  const [similares, setSimilares] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('coleccion'); // coleccion | similares
  const [enMiLista, setEnMiLista] = useState(false);
  const [cargandoLista, setCargandoLista] = useState(false);
  // Estados para series (TV)
  const esSerie = itemActual?.tipo === 'tv';
    // Estados para calificación
    const [modalCalificar, setModalCalificar] = useState(false);
    const [calificacion, setCalificacion] = useState(0);
    const [enviandoCalificacion, setEnviandoCalificacion] = useState(false);
  const [detallesSerie, setDetallesSerie] = useState(null);
  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState(null);
  const [episodios, setEpisodios] = useState([]);
  const [cargandoEpisodios, setCargandoEpisodios] = useState(false);
  const [player, setPlayer] = useState({ visible: false, url: null, youtubeId: null, titulo: null, poster: null, esSerie: false, temporada: null, epNumero: null });
  const [previewTrailer, setPreviewTrailer] = useState({ visible: false, youtubeId: null, vimeoId: null });
  // Estado de reproducción para trailers en web (react-player)
  const [trailerDisponible, setTrailerDisponible] = useState(false);

  const { token, perfilActual } = useAutenticacion();
  const portada = itemActual?.fondo || itemActual?.poster || null;
  const anio = useMemo(() => (itemActual?.fecha ? String(itemActual.fecha).slice(0, 4) : ''), [itemActual?.fecha]);

  // Función para cambiar el elemento actual
  const cambiarElemento = (nuevoItem) => {
    setItemActual(nuevoItem);
    // Resetear estados relacionados
    setDetallesSerie(null);
    setTemporadaSeleccionada(null);
    setEpisodios([]);
    setEnMiLista(false);
    setTab('coleccion');
  };

  useEffect(() => {
    (async () => {
      try {
        setCargando(true); setError(null);
        const datos = await obtenerPopulares({ tipo: itemActual?.tipo || 'all', periodo: 'week' });
        setSimilares((datos || []).filter((d) => d.id !== itemActual?.id).slice(0, 18));
        
        // Verificar si está en Mi Lista
        if (token && perfilActual?.id && itemActual?.id) {
          try {
            const estaEnLista = await verificarEnMiLista(token, perfilActual.id, {
              tipo: itemActual.tipo,
              contenido_id: itemActual.id
            });
            setEnMiLista(estaEnLista);
          } catch (e) {
            console.log('Error al verificar Mi Lista:', e);
          }
        }
      } catch (e) {
        setError('Error al cargar similares');
      } finally {
        setCargando(false);
      }
    })();
  }, [itemActual?.id, itemActual?.tipo, token, perfilActual?.id]);

  // Cuando se abre el modal de calificación, cargar la calificación existente (si la hay)
  useEffect(() => {
    if (!modalCalificar) return;
    let activo = true;
    (async () => {
      try {
        if (!token || !perfilActual?.id || !itemActual?.id) return;
        const califs = await obtenerCalificaciones(token, perfilActual.id);
        if (!activo) return;
        const encontrado = (califs || []).find(c => String(c.contenido_id) === String(itemActual.id) && c.tipo === itemActual.tipo);
        setCalificacion(encontrado ? Number(encontrado.estrellas) : 0);
      } catch (e) {
        console.log('Error cargando calificación existente:', e);
      }
    })();
    return () => { activo = false; };
  }, [modalCalificar, token, perfilActual?.id, itemActual?.id, itemActual?.tipo]);

  // Cargar detalles y primera temporada si es serie
  useEffect(() => {
    let activo = true;
    (async () => {
      if (!esSerie || !itemActual?.id) return;
      try {
        const det = await obtenerDetallesSerie(itemActual.id);
        if (!activo) return;
        setDetallesSerie(det);
        const numeroTemp = (det?.temporadas?.find(t => t.season_number > 0)?.season_number) || 1;
        setTemporadaSeleccionada(numeroTemp);
        setCargandoEpisodios(true);
        const temp = await obtenerEpisodiosTemporada(itemActual.id, numeroTemp);
        if (!activo) return;
        setEpisodios(temp.episodios || []);
      } catch (e) {
        console.log('Error cargando detalles de serie:', e);
      } finally {
        setCargandoEpisodios(false);
      }
    })();
    return () => { activo = false; };
  }, [esSerie, itemActual?.id]);

  // Autoplay de tráiler superpuesto en la cabecera (web y móvil)
  useEffect(() => {
    let cancelado = false;
    let timer = null;
    (async () => {
      try {
        if (!itemActual?.id) return;
        const datos = await obtenerVideosContenido(itemActual?.tipo || 'movie', itemActual?.id);
        const t = datos?.trailer_principal;
        if (t?.site === 'YouTube' && t?.key) {
          if (!cancelado) setPreviewTrailer({ visible: true, youtubeId: t.key, vimeoId: null });
          if (!cancelado) setTrailerDisponible(true);
        } else if (t?.site === 'Vimeo' && t?.key) {
          if (!cancelado) setPreviewTrailer({ visible: true, youtubeId: null, vimeoId: t.key });
          if (!cancelado) setTrailerDisponible(true);
        } else {
          const v = (datos?.videos || []).find(v => v.site === 'YouTube' && v.key) || (datos?.videos || []).find(v => v.site === 'Vimeo' && v.key);
          if (v?.site === 'YouTube' && v?.key) {
            if (!cancelado) setPreviewTrailer({ visible: true, youtubeId: v.key, vimeoId: null });
            if (!cancelado) setTrailerDisponible(true);
          } else if (v?.site === 'Vimeo' && v?.key) {
            if (!cancelado) setPreviewTrailer({ visible: true, youtubeId: null, vimeoId: v.key });
            if (!cancelado) setTrailerDisponible(true);
          }
        }
        if (!cancelado) {
          // Cerrar automáticamente tras 30s si no hay evento de fin disponible
          timer = setTimeout(() => setPreviewTrailer({ visible: false, youtubeId: null, vimeoId: null }), 30000);
        }
      } catch {}
    })();
    return () => {
      cancelado = true;
      if (timer) clearTimeout(timer);
      setPreviewTrailer({ visible: false, youtubeId: null, vimeoId: null });
      setTrailerDisponible(false);
    };
  }, [itemActual?.id, itemActual?.tipo]);

  // Cambiar temporada
  const cambiarTemporada = async (numero) => {
    try {
      setTemporadaSeleccionada(numero);
      setCargandoEpisodios(true);
      const temp = await obtenerEpisodiosTemporada(itemActual.id, numero);
      setEpisodios(temp.episodios || []);
    } catch (e) {
      console.log('Error al cambiar temporada:', e);
    } finally {
      setCargandoEpisodios(false);
    }
  };

  // Reproducción desde JSON locales
const reproducirPelicula = async () => {
    try {
      // Intentos tolerantes para localizar la fuente local de película
      let fuente = null;
      try { fuente = await obtenerFuentePeliculaLocal({ titulo: itemActual?.titulo, anio }); } catch (_) {}
      if (!fuente?.url) {
        try { fuente = await obtenerFuentePeliculaLocal({ titulo: itemActual?.titulo }); } catch (_) {}
      }
      if (!fuente?.url && anio) {
        try { fuente = await obtenerFuentePeliculaLocal({ anio }); } catch (_) {}
      }
      if (!fuente?.url) throw new Error('Fuente inválida');
      const esWeb = Platform.OS === 'web';
      let url = String(fuente.url || '');
      // Normaliza enlaces de Dropbox para acceso directo
      url = url.replace('dl.dropbox.com', 'dl.dropboxusercontent.com');
      if (!/[?&]dl=1/.test(url)) {
        const sep = url.includes('?') ? '&' : '?';
        url = `${url}${sep}dl=1`;
      }
      const extension = url.split('?')[0].split('#')[0].split('.').pop().toLowerCase();
      // En web, si es MKV, usar transcodificación en tiempo real a MP4
      if (esWeb && extension === 'mkv') {
        const transUrl = `${CONFIGURACION.BASE_URL}/contenidos/transcodificar?url=${encodeURIComponent(url)}`;
        url = transUrl;
      }
      setPlayer({ visible: true, url, youtubeId: null, vimeoId: null, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: false, temporada: null, epNumero: null });
      // Ocultar tráiler previo para evitar superposición
      setPreviewTrailer({ visible: false, youtubeId: null, vimeoId: null });
    } catch (e) {
      try {
        const datos = await obtenerVideosContenido(itemActual?.tipo || 'movie', itemActual?.id);
        const t = datos?.trailer_principal;
        if (t?.site === 'Vimeo' && t?.key) {
          setPlayer({ visible: true, url: null, youtubeId: null, vimeoId: t.key, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: false, temporada: null, epNumero: null });
          setPreviewTrailer({ visible: false, youtubeId: null, vimeoId: null });
          return;
        }
        if (t?.site === 'YouTube' && t?.key) {
          setPlayer({ visible: true, url: null, youtubeId: t.key, vimeoId: null, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: false, temporada: null, epNumero: null });
          setPreviewTrailer({ visible: false, youtubeId: null, vimeoId: null });
          return;
        }
        // fallbacks
        const v = (datos?.videos || []).find(v => v.site === 'Vimeo' && v.key);
        if (v?.key) {
          setPlayer({ visible: true, url: null, youtubeId: null, vimeoId: v.key, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: false, temporada: null, epNumero: null });
          setPreviewTrailer({ visible: false, youtubeId: null, vimeoId: null });
          return;
        }
        const y = (datos?.videos || []).find(v => v.site === 'YouTube' && v.key);
        if (y?.key) {
          setPlayer({ visible: true, url: null, youtubeId: y.key, vimeoId: null, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: false, temporada: null, epNumero: null });
          setPreviewTrailer({ visible: false, youtubeId: null, vimeoId: null });
          return;
        }
        Alert.alert('Video no disponible', 'No se encontró un tráiler disponible.');
        // Abrir overlay con reproductor sin fuente para dar feedback
        setPlayer({ visible: true, url: null, youtubeId: null, vimeoId: null, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: false, temporada: null, epNumero: null });
      } catch (e2) {
        Alert.alert('Video no disponible', 'No se encontró la película en el catálogo local ni tráiler en la API.');
        // Abrir overlay con reproductor sin fuente para dar feedback
        setPlayer({ visible: true, url: null, youtubeId: null, vimeoId: null, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: false, temporada: null, epNumero: null });
      }
    }
  };

  const reproducirEpisodio = async (epNumero) => {
    try {
      const nombreSerie = detallesSerie?.nombre || detallesSerie?.titulo || itemActual?.titulo;
      const fuente = await obtenerFuenteSerieLocal({ nombre: nombreSerie, temporada: temporadaSeleccionada, episodio: epNumero });
      if (!fuente?.url) throw new Error('Fuente inválida');
      const esWeb = Platform.OS === 'web';
      let url = String(fuente.url || '');
      url = url.replace('dl.dropbox.com', 'dl.dropboxusercontent.com');
      if (!/[?&]dl=1/.test(url)) {
        const sep = url.includes('?') ? '&' : '?';
        url = `${url}${sep}dl=1`;
      }
      const extension = url.split('?')[0].split('#')[0].split('.').pop().toLowerCase();
      if (esWeb && extension === 'mkv') {
        const transUrl = `${CONFIGURACION.BASE_URL}/contenidos/transcodificar?url=${encodeURIComponent(url)}`;
        url = transUrl;
      }
      setPlayer({ visible: true, url, youtubeId: null, vimeoId: null, titulo: `${itemActual?.titulo} T${temporadaSeleccionada}E${epNumero}`, poster: itemActual?.poster, esSerie: true, temporada: temporadaSeleccionada, epNumero });
      setPreviewTrailer({ visible: false, youtubeId: null, vimeoId: null });
    } catch (e) {
      try {
        const datos = await obtenerVideosContenido('tv', itemActual?.id);
        const t = datos?.trailer_principal;
        if (t?.site === 'Vimeo' && t?.key) {
          setPlayer({ visible: true, url: null, youtubeId: null, vimeoId: t.key, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: true, temporada: temporadaSeleccionada, epNumero });
          setPreviewTrailer({ visible: false, youtubeId: null, vimeoId: null });
          return;
        }
        if (t?.site === 'YouTube' && t?.key) {
          setPlayer({ visible: true, url: null, youtubeId: t.key, vimeoId: null, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: true, temporada: temporadaSeleccionada, epNumero });
          setPreviewTrailer({ visible: false, youtubeId: null, vimeoId: null });
          return;
        }
        const v = (datos?.videos || []).find(v => v.site === 'Vimeo' && v.key);
        if (v?.key) {
          setPlayer({ visible: true, url: null, youtubeId: null, vimeoId: v.key, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: true, temporada: temporadaSeleccionada, epNumero });
          setPreviewTrailer({ visible: false, youtubeId: null, vimeoId: null });
          return;
        }
        const y = (datos?.videos || []).find(v => v.site === 'YouTube' && v.key);
        if (y?.key) {
          setPlayer({ visible: true, url: null, youtubeId: y.key, vimeoId: null, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: true, temporada: temporadaSeleccionada, epNumero });
          setPreviewTrailer({ visible: false, youtubeId: null, vimeoId: null });
          return;
        }
        Alert.alert('Video no disponible', 'No se encontró un tráiler disponible de la serie.');
        setPlayer({ visible: true, url: null, youtubeId: null, vimeoId: null, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: true, temporada: temporadaSeleccionada, epNumero });
      } catch (e2) {
        Alert.alert('Video no disponible', 'No se encontró el episodio local ni tráiler en la API.');
        setPlayer({ visible: true, url: null, youtubeId: null, vimeoId: null, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: true, temporada: temporadaSeleccionada, epNumero });
      }
    }
  };

  const manejarMiLista = async () => {
    if (!token || !perfilActual?.id || !itemActual?.id) {
      Alert.alert('Error', 'Debes iniciar sesión y seleccionar un perfil');
      return;
    }

    setCargandoLista(true);
    try {
      if (enMiLista) {
        await quitarDeMiLista(token, perfilActual.id, {
          tipo: itemActual.tipo,
          contenido_id: itemActual.id
        });
        setEnMiLista(false);
        Alert.alert('Éxito', 'Quitado de Mi Lista');
      } else {
        await agregarAMiLista(token, perfilActual.id, {
          tipo: itemActual.tipo,
          contenido_id: itemActual.id,
          titulo: itemActual.titulo,
          poster: itemActual.poster
        });
        setEnMiLista(true);
        Alert.alert('Éxito', 'Agregado a Mi Lista');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Error al actualizar Mi Lista');
    } finally {
      setCargandoLista(false);
    }
  };

  return (
    <View style={estilos.overlay}>
      <StatusBar barStyle="light-content" />
        {/* Modal de calificación */}
        <Modal visible={modalCalificar} transparent animationType="fade">
          <TouchableOpacity
            activeOpacity={1}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setModalCalificar(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={{ backgroundColor: '#222', borderRadius: 12, padding: 24, alignItems: 'center', width: 300 }}
              onPress={() => {}}
            >
              {/* Poster dentro del modal de calificación */}
              {itemActual?.poster ? (
                <Image source={{ uri: itemActual.poster }} style={{ width: 140, height: 210, borderRadius: 8, marginBottom: 12 }} />
              ) : null}
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Califica esta película</Text>
              <View style={{ flexDirection: 'row', marginBottom: 18 }}>
                {[0,1,2,3,4,5].map((num) => (
                  <TouchableOpacity key={num} onPress={() => setCalificacion(num)}>
                    <Ionicons name={num <= calificacion ? 'star' : 'star-outline'} size={36} color={num <= calificacion ? '#FFD700' : '#888'} style={{ marginHorizontal: 4 }} />
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={{ backgroundColor: '#E50914', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10, marginBottom: 8 }}
                disabled={enviandoCalificacion}
                onPress={async () => {
                  setEnviandoCalificacion(true);
                  try {
                    if (!token || !perfilActual?.id || !itemActual?.id) throw new Error('Debes iniciar sesión y seleccionar un perfil');
                    await guardarCalificacion(token, {
                      perfil_id: perfilActual.id,
                      contenido_id: itemActual.id,
                      tipo: itemActual.tipo,
                      estrellas: calificacion
                    });
                    setModalCalificar(false);
                    Alert.alert('¡Gracias!', `Calificación guardada: ${calificacion} estrellas`);
                  } catch (e) {
                    Alert.alert('Error', e.message || 'No se pudo guardar la calificación');
                  } finally {
                    setEnviandoCalificacion(false);
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Guardar</Text>
              </TouchableOpacity>
              {/* Eliminado botón Cancelar por petición del usuario; cerrar tocando fuera del modal */}
              <TouchableOpacity onPress={async () => {
                // Eliminar calificación
                try {
                  if (!token || !perfilActual?.id || !itemActual?.id) throw new Error('Debes iniciar sesión y seleccionar un perfil');
                  await eliminarCalificacion(token, { perfil_id: perfilActual.id, contenido_id: itemActual.id, tipo: itemActual.tipo });
                  setCalificacion(0);
                  setModalCalificar(false);
                  Alert.alert('Éxito', 'Calificación eliminada');
                } catch (e) {
                  Alert.alert('Error', e.message || 'No se pudo eliminar la calificación');
                }
              }}>
                <Text style={{ color: '#fff', marginTop: 10 }}>Quitar calificación</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      {player.visible && (
        <View style={estilos.playerOverlay}>
          <View style={estilos.playerTopBar}>
            <TouchableOpacity onPress={() => setPlayer({ visible: false, url: null, youtubeId: null, vimeoId: null, titulo: null, poster: null, esSerie: false, temporada: null, epNumero: null })} style={estilos.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={estilos.playerTitulo} numberOfLines={1}>{player.titulo || 'Reproduciendo'}</Text>
            {/* Espaciador a la derecha */}
            <View style={{ width: 32 }} />
          </View>
          {player.vimeoId || player.youtubeId ? (
            <ComponenteVideo
              uri={player.vimeoId
                ? `https://player.vimeo.com/video/${player.vimeoId}?title=0&byline=0&portrait=0`
                : `https://www.youtube-nocookie.com/embed/${player.youtubeId}?playsinline=1&modestbranding=1&rel=0&fs=1&controls=1`}
              style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
              muted={false}
            />
          ) : (
            <ReproductorVideo 
              sourceUrl={player.url}
              poster={player.poster}
              onClose={() => setPlayer({ visible: false, url: null, youtubeId: null, vimeoId: null, titulo: null, poster: null, esSerie: false, temporada: null, epNumero: null })}
              episodes={player.esSerie ? episodios : []}
              seasonNumber={player.esSerie ? player.temporada : undefined}
              currentEpisodeNumber={player.esSerie ? player.epNumero : undefined}
              onSelectEpisode={(num) => reproducirEpisodio(num)}
            />
          )}
        </View>
      )}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Cabecera imagen */}
        <View style={estilos.topMedia}>
          {portada ? (
            <Image source={{ uri: portada }} style={estilos.mediaImg} resizeMode="cover" />
          ) : (
            <View style={[estilos.mediaImg, { backgroundColor: '#222' }]} />
          )}
          {/* Overlay de tráiler (web y móvil) */}
          {previewTrailer.visible && (
            <View style={estilos.trailerOverlayInline}>
              {previewTrailer.youtubeId ? (
                <ComponenteVideo
                  uri={`https://www.youtube-nocookie.com/embed/${previewTrailer.youtubeId}?playsinline=1&modestbranding=1&rel=0&fs=0&controls=1`}
                  style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
                />
              ) : previewTrailer.vimeoId ? (
                <ComponenteVideo
                  uri={`https://player.vimeo.com/video/${previewTrailer.vimeoId}?title=0&byline=0&portrait=0`}
                  style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
                />
              ) : null}
              <TouchableOpacity style={estilos.trailerCloseBtn} onPress={() => setPreviewTrailer({ visible: false, youtubeId: null, vimeoId: null })}>
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          <View style={estilos.mediaOverlay} />
          <View style={estilos.topBar}>
            <TouchableOpacity onPress={onCerrar} style={estilos.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={estilos.iconBtn}>
                <Ionicons name="search" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={estilos.iconBtn}>
                <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>


        </View>

        {/* Detalle */}
        <View style={estilos.body}>
          <Text style={estilos.titulo}>{itemActual?.titulo || 'Título'}</Text>
          <View style={estilos.metaRow}>
            {!!anio && <Text style={estilos.metaTxt}>{anio}</Text>}
            <View style={estilos.badgeEdad}><Text style={estilos.badgeEdadTxt}>13+</Text></View>
            <Text style={estilos.metaTxt}>1 h 24 min</Text>
            <Ionicons name="checkmark-circle" size={16} color="#2bb871" style={{ marginLeft: 6 }} />
          </View>

          {/* Botones principales */}
          <TouchableOpacity style={[estilos.btn, estilos.btnPlay]} onPress={() => {
            if (esSerie) {
              const numero = (episodios[0]?.numero) || 1;
              reproducirEpisodio(numero);
            } else {
              reproducirPelicula();
            }
          }}>
            <Ionicons name="play" size={18} color="#000" />
            <Text style={[estilos.btnTxt, { color: '#000' }]}>Ver</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[estilos.btn, estilos.btnDownload]}>
            <Ionicons name="download" size={18} color="#fff" />
            <Text style={estilos.btnTxt}>Descargar</Text>
          </TouchableOpacity>

          {/* Descripción y créditos */}
          {!!itemActual?.resumen && <Text style={estilos.descripcion}>{itemActual.resumen}</Text>}
          <Text style={estilos.credito}><Text style={estilos.creditoLbl}>Protagonistas: </Text>No disponible</Text>
          <Text style={estilos.credito}><Text style={estilos.creditoLbl}>Dirección: </Text>No disponible</Text>

          {/* Bloque de temporadas y episodios para series */}
          {esSerie && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16, marginBottom: 8 }}>Temporadas</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {(detallesSerie?.temporadas || [])
                  .filter(t => t.season_number > 0)
                  .map((t) => (
                    <TouchableOpacity
                      key={t.id || t.season_number}
                      style={[estilos.tempChip, temporadaSeleccionada === t.season_number && estilos.tempChipSel]}
                      onPress={() => cambiarTemporada(t.season_number)}
                    >
                      <Text style={[estilos.tempChipTxt, temporadaSeleccionada === t.season_number && estilos.tempChipTxtSel]}>T{t.season_number}</Text>
                    </TouchableOpacity>
                ))}
              </ScrollView>

              {cargandoEpisodios ? (
                <View style={{ paddingVertical: 12 }}><ActivityIndicator color="#E50914" /></View>
              ) : episodios.length === 0 ? (
                <Text style={{ color: '#bbb' }}>No hay episodios disponibles.</Text>
              ) : (
                episodios.map((ep) => (
                  <View key={ep.id} style={estilos.episodioRow}>
                    {ep.imagen ? (
                      <Image source={{ uri: ep.imagen }} style={estilos.episodioImg} />
                    ) : (
                      <View style={[estilos.episodioImg, { backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="image" color="#555" size={22} />
                      </View>
                    )}
                    <View style={{ flex: 1, paddingLeft: 10 }}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>{ep.numero}. {ep.titulo}</Text>
                      {!!ep.duracion && <Text style={{ color: '#bbb', fontSize: 12, marginTop: 2 }}>{ep.duracion} min</Text>}
                      {!!ep.resumen && <Text style={{ color: '#bbb', fontSize: 12, marginTop: 6 }} numberOfLines={3}>{ep.resumen}</Text>}
                    </View>
                    <TouchableOpacity style={{ padding: 8 }} onPress={() => reproducirEpisodio(ep.numero)}>
                      <Ionicons name="play" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Acciones */}
          <View style={estilos.accionesRow}>
            <TouchableOpacity style={estilos.accion} onPress={manejarMiLista} disabled={cargandoLista}>
              {cargandoLista ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons 
                  name={enMiLista ? "checkmark" : "add"} 
                  size={22} 
                  color={enMiLista ? "#2bb871" : "#fff"} 
                />
              )}
              <Text style={[estilos.accionTxt, enMiLista && { color: '#2bb871' }]}>
                {enMiLista ? 'En Mi Lista' : 'Mi lista'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.accion} onPress={() => setModalCalificar(true)}>
              <Ionicons name="star" size={22} color="#FFD700" />
              <Text style={estilos.accionTxt}>Calificar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.accion}>
              <Ionicons name="share-social" size={22} color="#fff" />
              <Text style={estilos.accionTxt}>Compartir</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs de secciones */}
          <View style={estilos.tabsRow}>
            <TouchableOpacity onPress={() => setTab('coleccion')}>
              <Text style={[estilos.tabTxt, tab === 'coleccion' && estilos.tabTxtActivo]}>Colección</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTab('similares')}>
              <Text style={[estilos.tabTxt, tab === 'similares' && estilos.tabTxtActivo]}>Más títulos similares</Text>
            </TouchableOpacity>
          </View>

          {/* Listas */}
          {cargando ? (
            <View style={{ paddingVertical: 20 }}><ActivityIndicator color="#E50914" /></View>
          ) : error ? (
            <Text style={{ color: '#bbb' }}>{error}</Text>
          ) : (
            <>
              {tab === 'coleccion' && (
                <FilaHorizontal titulo="Colección" datos={similares.slice(0, 10)} onPressItem={cambiarElemento} />
              )}
              {tab === 'similares' && (
                <FilaHorizontal titulo="Más títulos similares" datos={similares.slice(10)} onPressItem={cambiarElemento} />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  overlay: {
     position: 'absolute',
     top: 0, left: 0, right: 0, bottom: 0,
     backgroundColor: '#000' },
  topMedia: {
     width: '100%', 
     aspectRatio: 16/9, 
     backgroundColor: '#111', 
     overflow: 'hidden' },
  mediaImg: { width: '100%', height: '100%' },
  mediaOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  topBar: { position: 'absolute', top: 8, left: 8, right: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { padding: 6, marginHorizontal: 2, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 16 },
  captionWrap: { position: 'absolute', bottom: 8, left: 12, right: 12, alignItems: 'center' },
  captionTxt: { color: '#fff', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, fontSize: 12 },

  body: { paddingHorizontal: 12, paddingTop: 12 },
  titulo: { color: '#fff', fontSize: 20, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  metaTxt: { color: '#bbb' },
  badgeEdad: { borderWidth: 1, borderColor: '#bbb', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  badgeEdadTxt: { color: '#bbb', fontWeight: '700', fontSize: 12 },
  btn: { height: 38, borderRadius: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  btnPlay: { backgroundColor: '#fff' },
  btnDownload: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  btnTxt: { color: '#fff', fontWeight: '700' },
  descripcion: { color: '#e5e5e5', marginTop: 12, lineHeight: 20 },
  credito: { color: '#bbb', marginTop: 6 },
  creditoLbl: { color: '#888' },

  accionesRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  accion: { alignItems: 'center', gap: 6 },
  accionTxt: { color: '#bbb', fontSize: 12 },

  tabsRow: { flexDirection: 'row', gap: 16, marginTop: 18, marginBottom: 6 },
  tabTxt: { color: '#bbb', fontWeight: '700' },
  tabTxtActivo: { color: '#fff' },
  tempChip: { backgroundColor: '#2b2b2b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginRight: 8 },
  tempChipSel: { backgroundColor: '#E50914' },
  tempChipTxt: { color: '#ddd' },
  tempChipTxtSel: { color: '#fff', fontWeight: '800' },
  episodioRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  episodioImg: { width: 120, height: 68, borderRadius: 6, backgroundColor: '#333' },
  trailerOverlayInline: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 12 },
  trailerCloseBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 16 },
  playTrailerBtn: { position: 'absolute', bottom: 20, left: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  playerOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#000', zIndex: 20 },
  playerTopBar: { position: 'absolute', top: 8, left: 8, right: 8, zIndex: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playerTitulo: { color: '#fff', fontWeight: '700', flex: 1, textAlign: 'center' },
});
