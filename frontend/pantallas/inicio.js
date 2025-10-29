import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Modal, TextInput, Image, Alert } from 'react-native';
import BarraNavegacion from '../componentes/BarraNavegacion';
import { obtenerPopulares, buscarContenidos, agregarAMiLista } from '../servicios/api';
import HeroBanner from '../componentes/HeroBanner';
import FilaHorizontal from '../componentes/FilaHorizontal';
import DetalleContenido from './DetalleContenido';
import { useAutenticacion } from '../contextos/ContextoAutenticacion';

// Lista base de categorías (TMDB géneros aproximados en español)
const CATEGORIAS = [
  'Acción','Aventura','Animación','Comedia','Crimen','Documental','Drama','Familia',
  'Fantasía','Historia','Terror','Música','Misterio','Romance','Ciencia ficción',
  'Película de TV','Suspenso','Guerra','Western'
];

export default function Inicio({ onOpenBuscar }) {
  const { token, perfilActual } = useAutenticacion();
  const [hero, setHero] = useState(null);
  const [tendencias, setTendencias] = useState([]);
  const [peliculasPop, setPeliculasPop] = useState([]);
  const [seriesPop, setSeriesPop] = useState([]);
  const [filtro, setFiltro] = useState('all');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [detalleItem, setDetalleItem] = useState(null);
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  // Categorías
  const [mostrarCategorias, setMostrarCategorias] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [tipoCategoria, setTipoCategoria] = useState('all'); // all | movie | tv
  const [resultadosCategoria, setResultadosCategoria] = useState([]);
  const [cargandoCategoria, setCargandoCategoria] = useState(false);

  // Datos mock de juegos para la fila de Inicio
  const juegosMock = [
    { id: 1, titulo: 'Stranger Things: 1984', descripcion: 'Juega como los personajes de Stranger Things en este emocionante juego de aventuras.', imagen: 'https://www.cnet.com/a/img/resize/78f4d1725cb6d6cd8a50ebc43c748ebb02e11672/hub/2017/10/04/fcb79536-e32f-4501-9bba-07d536e5c441/strangerthingsgame.jpg?auto=webp&width=1920', categoria: 'Aventura', rating: 4.5, destacado: true },
    { id: 2, titulo: "The Queen's Gambit Chess", descripcion: 'Mejora tus habilidades de ajedrez con este juego inspirado en la serie.', imagen: 'https://www.cnet.com/a/img/resize/036a6ce65bd8776242f6a179944fb7373fa2fca9/hub/2023/07/10/fe2669d2-db28-4546-96c4-138bc3919ae4/queens-gambit.jpg?auto=webp&fit=crop&height=675&width=1200', categoria: 'Estrategia', rating: 4.8 },
    { id: 3, titulo: 'Money Heist: The Experience', descripcion: 'Planifica el atraco perfecto en este juego de estrategia.', imagen: 'https://play-lh.googleusercontent.com/r8WY5MaKMLMRqFJw0yyhMXuxZQhP2_mw35s1vRrNwH_B2IYEEDCUyjRZqkDxRxMbynZ1=w526-h296-rw', categoria: 'Estrategia', rating: 4.3 },
    { id: 4, titulo: 'Squid Game: Challenge', descripcion: 'Sobrevive a los juegos mortales en esta experiencia inmersiva.', imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWT7g_sgsTNyiJcAnZaG20jjfY2caH60dcmnout-Tw8YF2NSjC6eWSkxC4IhwP9Pp8bso&usqp=CAU', categoria: 'Supervivencia', rating: 4.6 },
    { id: 5, titulo: 'Bridgerton: Society', descripcion: 'Navega por la alta sociedad londinense en este juego de simulación.', imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8ZJBiYACxL9ppYZqvqL4RAyBhTZkVYuCa7fCxkXVTlbJOLKjyA1fHAKIDGzXmvPbRV7s&usqp=CAU', categoria: 'Simulación', rating: 4.2 },
    { id: 6, titulo: 'The Witcher: Monster Hunt', descripcion: 'Caza monstruos como Geralt en este juego de acción.', imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRMfFah_z28g-6PNpyxXYs1iz5G8Md4yp3tLl2oWRGFTT7xHNTbDKerK9VQJDz2Zyn5h0&usqp=CAU', categoria: 'Acción', rating: 4.7 },
  ];
  const juegosFila = juegosMock.map((j) => ({ id: j.id, tipo: 'game', poster: j.imagen, titulo: j.titulo }));

  useEffect(() => {
    (async () => {
      try {
        const all = await obtenerPopulares({ tipo: 'all', periodo: 'week' });
        const movies = await obtenerPopulares({ tipo: 'movie', periodo: 'week' });
        const tv = await obtenerPopulares({ tipo: 'tv', periodo: 'week' });
        setHero(all[0] || null);
        setTendencias(all.slice(1, 21));
        setPeliculasPop(movies.filter((i) => i.tipo === 'movie').slice(0, 20));
        setSeriesPop(tv.filter((i) => i.tipo === 'tv').slice(0, 20));
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    })();
    
    // Cleanup del timeout cuando el componente se desmonte
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const onPlay = (item) => {
    // Abrir el detalle del contenido con el reproductor activado
    setDetalleItem(item);
  };
  
  const onMyList = async (item) => {
    // Agregar contenido a Mi Lista
    if (!token || !perfilActual?.id) {
      Alert.alert('Error', 'Debes iniciar sesión y seleccionar un perfil para agregar contenido a Mi Lista');
      return;
    }

    try {
      await agregarAMiLista(token, perfilActual.id, {
        tipo: item.tipo,
        contenido_id: item.id,
        titulo: item.titulo,
        poster: item.poster
      });
      Alert.alert('Éxito', `"${item.titulo}" agregado a Mi Lista`);
    } catch (error) {
      // Si ya está en la lista, mostrar mensaje informativo
      if (error.message.includes('Ya está en Mi Lista')) {
        Alert.alert('Información', `"${item.titulo}" ya está en Mi Lista`);
      } else {
        Alert.alert('Error', error.message || 'Error al agregar a Mi Lista');
      }
    }
  };
  const onPressItem = (item) => {
    setMostrarBuscador(false);
    setDetalleItem(item);
  };

  // Debounce para búsqueda en tiempo real
  const [timeoutId, setTimeoutId] = useState(null);

  const ejecutarBusqueda = async (searchQuery = q) => {
    if (searchQuery.trim() === '') {
      setResultados([]);
      return;
    }
    
    setBuscando(true);
    try {
      const data = await buscarContenidos({ q: searchQuery.trim(), tipo: 'multi' });
      setResultados(data || []);
    } catch (error) {
      console.error('Error al buscar contenidos:', error);
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  };

  // Cargar resultados para una categoría seleccionada
  const cargarCategoria = async (categoria, tipo = tipoCategoria) => {
    if (!categoria) return;
    setCargandoCategoria(true);
    try {
      const tipoBusqueda = tipo === 'all' ? 'multi' : tipo;
      const data = await buscarContenidos({ q: categoria, tipo: tipoBusqueda });
      setResultadosCategoria(data || []);
    } catch (e) {
      console.error('Error al cargar categoría:', e);
      setResultadosCategoria([]);
    } finally {
      setCargandoCategoria(false);
    }
  };

  const buscarConDebounce = (text) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const newTimeoutId = setTimeout(() => {
      ejecutarBusqueda(text);
    }, 500); // Esperar 500ms después de que el usuario deje de escribir
    
    setTimeoutId(newTimeoutId);
  };

  return (
    <View style={estilos.contenedor}>
      <BarraNavegacion label="Inicio" onPressBuscar={onOpenBuscar} />
      {cargando ? (
        <View style={estilos.centro}><ActivityIndicator size="large" /><Text style={{ color: '#fff', marginTop: 10 }}>Cargando...</Text></View>
      ) : error ? (
        <View style={estilos.centro}><Text style={{ color: '#fff' }}>Error: {error}</Text></View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 90 }}>
          {/* Chips superiores */}
          <View style={estilos.chipsFila}>
            <TouchableOpacity
              style={[estilos.chip, filtro === 'tv' && estilos.chipSel]}
              onPress={() => setFiltro('tv')}
            >
              <Text style={[estilos.chipTxt, filtro === 'tv' && estilos.chipTxtSel]}>Series</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.chip, filtro === 'movie' && estilos.chipSel]}
              onPress={() => setFiltro('movie')}
            >
              <Text style={[estilos.chipTxt, filtro === 'movie' && estilos.chipTxtSel]}>Películas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.chip, estilos.chipCategorias]}
              onPress={() => setMostrarCategorias(true)}
            >
              <Text style={estilos.chipTxt}>Categorías</Text>
            </TouchableOpacity>
          </View>

          {/* Hero (dinámico por filtro) */}
          <HeroBanner
            item={filtro === 'tv' ? (seriesPop[0] || hero) : filtro === 'movie' ? (peliculasPop[0] || hero) : hero}
            onPlay={onPlay}
            onMyList={onMyList}
          />

          {/* Listado estilo buscador para Películas y Series */}
          {filtro === 'tv' ? (
            <View style={estilos.resultsContainer}>
              <Text style={estilos.resultsTitle}>Series populares</Text>
              <View style={estilos.resultsGrid}>
                {seriesPop.filter(i => i.tipo === 'tv').map((item, index) => (
                  <TouchableOpacity
                    key={`tv-${item.id}-${index}`}
                    style={estilos.resultItem}
                    onPress={() => onPressItem(item)}
                  >
                    {item.poster ? (
                      <Image source={{ uri: item.poster }} style={estilos.resultPoster} />
                    ) : (
                      <View style={[estilos.resultPoster, estilos.posterPlaceholder]}>
                        <Text style={estilos.placeholderIcon}>🎬</Text>
                      </View>
                    )}
                    <View style={estilos.resultInfo}>
                      <Text style={estilos.resultTitle} numberOfLines={2}>{item.titulo}</Text>
                      <Text style={estilos.resultType}>Serie • {item.fecha ? item.fecha.slice(0,4) : 'N/A'}</Text>
                      {item.resumen && <Text style={estilos.resultDescription} numberOfLines={3}>{item.resumen}</Text>}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : filtro === 'movie' ? (
            <View style={estilos.resultsContainer}>
              <Text style={estilos.resultsTitle}>Películas populares</Text>
              <View style={estilos.resultsGrid}>
                {peliculasPop.map((item, index) => (
                  <TouchableOpacity
                    key={`movie-${item.id}-${index}`}
                    style={estilos.resultItem}
                    onPress={() => onPressItem(item)}
                  >
                    {item.poster ? (
                      <Image source={{ uri: item.poster }} style={estilos.resultPoster} />
                    ) : (
                      <View style={[estilos.resultPoster, estilos.posterPlaceholder]}>
                        <Text style={estilos.placeholderIcon}>🎬</Text>
                      </View>
                    )}
                    <View style={estilos.resultInfo}>
                      <Text style={estilos.resultTitle} numberOfLines={2}>{item.titulo}</Text>
                      <Text style={estilos.resultType}>Película • {item.fecha ? item.fecha.slice(0,4) : 'N/A'}</Text>
                      {item.resumen && <Text style={estilos.resultDescription} numberOfLines={3}>{item.resumen}</Text>}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : filtro === 'categoria' ? (
            <View style={estilos.resultsContainer}>
              <View style={estilos.cabeceraCategoria}>
                <Text style={estilos.resultsTitle}>Categoría: {categoriaSeleccionada}</Text>
                <View style={estilos.filtrosTipoRow}>
                  {['all','movie','tv'].map(t => (
                    <TouchableOpacity key={t} style={[estilos.filtroTipo, tipoCategoria===t && estilos.filtroTipoSel]} onPress={async () => {
                      setTipoCategoria(t);
                      await cargarCategoria(categoriaSeleccionada, t);
                    }}>
                      <Text style={[estilos.filtroTipoTxt, tipoCategoria===t && estilos.filtroTipoTxtSel]}>
                        {t==='all'?'Todos': t==='movie'?'Películas':'Series'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {cargandoCategoria ? (
                <View style={{ paddingVertical: 20 }}><ActivityIndicator color="#E50914" /></View>
              ) : resultadosCategoria.length === 0 ? (
                <Text style={{ color: '#bbb' }}>No hay resultados para esta categoría.</Text>
              ) : (
                <View style={estilos.resultsGrid}>
                  {resultadosCategoria.map((item, index) => (
                    <TouchableOpacity
                      key={`cat-${item.id}-${index}`}
                      style={estilos.resultItem}
                      onPress={() => onPressItem(item)}
                    >
                      {item.poster ? (
                        <Image source={{ uri: item.poster }} style={estilos.resultPoster} />
                      ) : (
                        <View style={[estilos.resultPoster, estilos.posterPlaceholder]}>
                          <Text style={estilos.placeholderIcon}>🎬</Text>
                        </View>
                      )}
                      <View style={estilos.resultInfo}>
                        <Text style={estilos.resultTitle} numberOfLines={2}>{item.titulo}</Text>
                        <Text style={estilos.resultType}>
                          {(item.tipo === 'movie' ? 'Película' : item.tipo === 'tv' ? 'Serie' : 'Contenido')} • {item.fecha ? item.fecha.slice(0,4) : 'N/A'}
                        </Text>
                        {item.resumen && <Text style={estilos.resultDescription} numberOfLines={3}>{item.resumen}</Text>}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <>
              
              <FilaHorizontal titulo="Juegos móviles" datos={juegosFila} onPressItem={onPressItem} />
              <FilaHorizontal titulo="Series" datos={seriesPop.filter(i => i.tipo === 'tv')} onPressItem={onPressItem} />
              <FilaHorizontal titulo="Películas" datos={peliculasPop} onPressItem={onPressItem} />
              <FilaHorizontal titulo="Nuestra selección de hoy para ti" datos={seriesPop} onPressItem={onPressItem} />
            </>
          )}
        </ScrollView>
      )}
      {!!detalleItem && (
        <DetalleContenido item={detalleItem} onCerrar={() => setDetalleItem(null)} />
      )}

      {/* Modal Buscador */}
      <Modal visible={mostrarBuscador} transparent animationType="fade">
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            {/* Header con barra de búsqueda */}
            <View style={estilos.searchHeader}>
              <TouchableOpacity 
                style={estilos.backButton} 
                onPress={() => { setMostrarBuscador(false); setQ(''); setResultados([]); }}
              >
                <Text style={estilos.backIcon}>←</Text>
              </TouchableOpacity>
              <View style={estilos.searchInputContainer}>
                <Text style={estilos.searchIcon}>🔍</Text>
                <TextInput
                  style={estilos.searchInput}
                  placeholder="Buscar películas y series..."
                  placeholderTextColor="#666"
                  value={q}
                  onChangeText={(text) => {
                     setQ(text);
                     if (text.trim().length > 2) {
                       buscarConDebounce(text);
                     } else if (text.trim().length === 0) {
                       setResultados([]);
                       setBuscando(false);
                     }
                   }}
                  autoFocus
                  returnKeyType="search"
                  onSubmitEditing={ejecutarBusqueda}
                />
                {q.length > 0 && (
                  <TouchableOpacity 
                    style={estilos.clearButton}
                    onPress={() => { setQ(''); setResultados([]); }}
                  >
                    <Text style={estilos.clearIcon}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Contenido de búsqueda */}
            <ScrollView style={estilos.searchContent} showsVerticalScrollIndicator={false}>
              {buscando ? (
                <View style={estilos.loadingContainer}>
                  <ActivityIndicator size="large" color="#E50914" />
                  <Text style={estilos.loadingText}>Buscando...</Text>
                </View>
              ) : q.trim().length === 0 ? (
                <View style={estilos.emptyState}>
                  <Text style={estilos.emptyIcon}>🎬</Text>
                  <Text style={estilos.emptyTitle}>Buscar en Netflix</Text>
                  <Text style={estilos.emptySubtitle}>Encuentra películas, series y más</Text>
                </View>
              ) : resultados.length === 0 && q.trim().length > 0 ? (
                <View style={estilos.noResults}>
                  <Text style={estilos.noResultsIcon}>😔</Text>
                  <Text style={estilos.noResultsTitle}>No encontramos nada</Text>
                  <Text style={estilos.noResultsSubtitle}>Intenta con otro término de búsqueda</Text>
                </View>
              ) : (
                <View style={estilos.resultsContainer}>
                  <Text style={estilos.resultsTitle}>Resultados para "{q}"</Text>
                  <View style={estilos.resultsGrid}>
                    {resultados.map((item, index) => (
                      <TouchableOpacity 
                        key={`${item.tipo}-${item.id}-${index}`}
                        style={estilos.resultItem}
                        onPress={() => {
                          onPressItem(item);
                          setMostrarBuscador(false);
                        }}
                      >
                        {item.poster ? (
                          <Image source={{ uri: item.poster }} style={estilos.resultPoster} />
                        ) : (
                          <View style={[estilos.resultPoster, estilos.posterPlaceholder]}>
                            <Text style={estilos.placeholderIcon}>🎬</Text>
                          </View>
                        )}
                        <View style={estilos.resultInfo}>
                          <Text style={estilos.resultTitle} numberOfLines={2}>{item.titulo}</Text>
                          <Text style={estilos.resultType}>
                            {item.tipo === 'movie' ? 'Película' : 'Serie'} • {item.fecha ? item.fecha.slice(0, 4) : 'N/A'}
                          </Text>
                          {item.resumen && (
                            <Text style={estilos.resultDescription} numberOfLines={3}>
                              {item.resumen}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Categorías */}
      <Modal visible={mostrarCategorias} transparent animationType="fade">
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View style={estilos.searchHeader}>
              <TouchableOpacity 
                style={estilos.backButton}
                onPress={() => setMostrarCategorias(false)}
              >
                <Text style={estilos.backIcon}>←</Text>
              </TouchableOpacity>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Categorías</Text>
            </View>
            <ScrollView style={{ flex: 1, backgroundColor: '#000' }} contentContainerStyle={{ padding: 16 }}>
              <View style={estilos.gridCategorias}>
                {CATEGORIAS.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={estilos.categoriaChip}
                    onPress={async () => {
                      setCategoriaSeleccionada(cat);
                      setMostrarCategorias(false);
                      setFiltro('categoria');
                      await cargarCategoria(cat, tipoCategoria);
                    }}
                  >
                    <Text style={estilos.categoriaTxt}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#141414' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chipsFila: { flexDirection: 'row', justifyContent: 'flex-start', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#2b2b2b' },
  chip: { backgroundColor: '#3a3a3a', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16 },
  chipTxt: { color: '#ddd', fontSize: 12 },
  chipSel: { backgroundColor: '#e50914' },
  chipTxtSel: { color: '#fff' },
  chipCategorias: { backgroundColor: '#444' },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#000',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  backIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#666',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    color: '#666',
    fontSize: 16,
  },
  searchContent: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  noResultsIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noResultsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSubtitle: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  resultsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  resultsGrid: {
    paddingBottom: 32,
  },
  cabeceraCategoria: { flexDirection: 'column', gap: 8 },
  filtrosTipoRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  filtroTipo: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14, backgroundColor: '#333' },
  filtroTipoSel: { backgroundColor: '#E50914' },
  filtroTipoTxt: { color: '#ddd', fontSize: 12, fontWeight: '700' },
  filtroTipoTxtSel: { color: '#fff' },
  gridCategorias: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoriaChip: { backgroundColor: '#1f1f1f', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18 },
  categoriaTxt: { color: '#fff', fontWeight: '700' },
  resultItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#111',
    borderRadius: 8,
    overflow: 'hidden',
  },
  resultPoster: {
    width: 100,
    height: 150,
    backgroundColor: '#333',
  },
  posterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
    color: '#666',
  },
  resultInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'flex-start',
  },
  resultTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultType: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultDescription: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 18,
  },
});