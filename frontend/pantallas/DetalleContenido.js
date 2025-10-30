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
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReproductorVideo from '../componentes/ReproductorVideo';
import ReproductorYouTube from '../componentes/ReproductorYouTube';
import ReproductorVimeo from '../componentes/ReproductorVimeo';
import FilaHorizontal from '../componentes/FilaHorizontal';
import { obtenerPopulares, agregarAMiLista, quitarDeMiLista, verificarEnMiLista, obtenerDetallesSerie, obtenerEpisodiosTemporada, obtenerVideosContenido, obtenerFuentePeliculaLocal, obtenerFuenteSerieLocal } from '../servicios/api';
import { useAutenticacion } from '../contextos/ContextoAutenticacion';

const { width } = Dimensions.get('window');

export default function DetalleContenido({ item, onCerrar }) {
  const [itemActual, setItemActual] = useState(item);
  const [similares, setSimilares] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('coleccion'); // coleccion | similares
  const [enMiLista, setEnMiLista] = useState(false);
  const [cargandoLista, setCargandoLista] = useState(false);
  // Estados para series (TV)
  const esSerie = itemActual?.tipo === 'tv';
  const [detallesSerie, setDetallesSerie] = useState(null);
  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState(null);
  const [episodios, setEpisodios] = useState([]);
  const [cargandoEpisodios, setCargandoEpisodios] = useState(false);
  const [player, setPlayer] = useState({ visible: false, url: null, youtubeId: null, titulo: null, poster: null, esSerie: false, temporada: null, epNumero: null });

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
      const fuente = await obtenerFuentePeliculaLocal({ titulo: itemActual?.titulo, anio });
      if (!fuente?.url) throw new Error('Fuente inválida');
      setPlayer({ visible: true, url: fuente.url, youtubeId: null, vimeoId: null, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: false, temporada: null, epNumero: null });
    } catch (e) {
      try {
        const datos = await obtenerVideosContenido(itemActual?.tipo || 'movie', itemActual?.id);
        const t = datos?.trailer_principal;
        if (t?.site === 'Vimeo' && t?.key) {
          setPlayer({ visible: true, url: null, youtubeId: null, vimeoId: t.key, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: false, temporada: null, epNumero: null });
          return;
        }
        if (t?.site === 'YouTube' && t?.key) {
          setPlayer({ visible: true, url: null, youtubeId: t.key, vimeoId: null, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: false, temporada: null, epNumero: null });
          return;
        }
        // fallbacks
        const v = (datos?.videos || []).find(v => v.site === 'Vimeo' && v.key);
        if (v?.key) {
          setPlayer({ visible: true, url: null, youtubeId: null, vimeoId: v.key, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: false, temporada: null, epNumero: null });
          return;
        }
        const y = (datos?.videos || []).find(v => v.site === 'YouTube' && v.key);
        if (y?.key) {
          setPlayer({ visible: true, url: null, youtubeId: y.key, vimeoId: null, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: false, temporada: null, epNumero: null });
          return;
        }
        Alert.alert('No disponible', 'No se encontró un tráiler disponible.');
      } catch (e2) {
        Alert.alert('No disponible', 'No se encontró la película en el catálogo local ni tráiler en la API.');
      }
    }
  };

  const reproducirEpisodio = async (epNumero) => {
    try {
      const nombreSerie = detallesSerie?.nombre || detallesSerie?.titulo || itemActual?.titulo;
      const fuente = await obtenerFuenteSerieLocal({ nombre: nombreSerie, temporada: temporadaSeleccionada, episodio: epNumero });
      if (!fuente?.url) throw new Error('Fuente inválida');
      setPlayer({ visible: true, url: fuente.url, youtubeId: null, vimeoId: null, titulo: `${itemActual?.titulo} T${temporadaSeleccionada}E${epNumero}`, poster: itemActual?.poster, esSerie: true, temporada: temporadaSeleccionada, epNumero });
    } catch (e) {
      try {
        const datos = await obtenerVideosContenido('tv', itemActual?.id);
        const t = datos?.trailer_principal;
        if (t?.site === 'Vimeo' && t?.key) {
          setPlayer({ visible: true, url: null, youtubeId: null, vimeoId: t.key, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: true, temporada: temporadaSeleccionada, epNumero });
          return;
        }
        if (t?.site === 'YouTube' && t?.key) {
          setPlayer({ visible: true, url: null, youtubeId: t.key, vimeoId: null, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: true, temporada: temporadaSeleccionada, epNumero });
          return;
        }
        const v = (datos?.videos || []).find(v => v.site === 'Vimeo' && v.key);
        if (v?.key) {
          setPlayer({ visible: true, url: null, youtubeId: null, vimeoId: v.key, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: true, temporada: temporadaSeleccionada, epNumero });
          return;
        }
        const y = (datos?.videos || []).find(v => v.site === 'YouTube' && v.key);
        if (y?.key) {
          setPlayer({ visible: true, url: null, youtubeId: y.key, vimeoId: null, titulo: itemActual?.titulo, poster: itemActual?.poster, esSerie: true, temporada: temporadaSeleccionada, epNumero });
          return;
        }
        Alert.alert('No disponible', 'No se encontró un tráiler disponible de la serie.');
      } catch (e2) {
        Alert.alert('No disponible', 'No se encontró el episodio local ni tráiler en la API.');
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
      {player.visible && (
        <View style={estilos.playerOverlay}>
          <View style={estilos.playerTopBar}>
            <TouchableOpacity onPress={() => setPlayer({ visible: false, url: null, youtubeId: null, vimeoId: null, titulo: null, poster: null, esSerie: false, temporada: null, epNumero: null })} style={estilos.iconBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={estilos.playerTitulo} numberOfLines={1}>{player.titulo || 'Reproduciendo'}</Text>
            <View style={{ width: 32 }} />
          </View>
          {player.vimeoId ? (
            <ReproductorVimeo
              videoId={player.vimeoId}
              onClose={() => setPlayer({ visible: false, url: null, youtubeId: null, vimeoId: null, titulo: null, poster: null, esSerie: false, temporada: null, epNumero: null })}
            />
          ) : player.youtubeId ? (
            <ReproductorYouTube
              videoId={player.youtubeId}
              onClose={() => setPlayer({ visible: false, url: null, youtubeId: null, vimeoId: null, titulo: null, poster: null, esSerie: false, temporada: null, epNumero: null })}
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
            <Image source={{ uri: portada }} style={estilos.mediaImg} />
          ) : (
            <View style={[estilos.mediaImg, { backgroundColor: '#222' }]} />
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
          {/* Subtítulo simulado */}
          <View style={estilos.captionWrap}>
            <Text style={estilos.captionTxt}>{/* El banco me desahuciará si no pago la renta.*/} Hola quieres ser mi tilina 😳</Text>
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
            <TouchableOpacity style={estilos.accion}>
              <Ionicons name="thumbs-up" size={22} color="#fff" />
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
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' },
  topMedia: { width, height: width * 0.56, backgroundColor: '#111' },
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
  playerOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#000', zIndex: 20 },
  playerTopBar: { position: 'absolute', top: 8, left: 8, right: 8, zIndex: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playerTitulo: { color: '#fff', fontWeight: '700', flex: 1, textAlign: 'center' },
});
