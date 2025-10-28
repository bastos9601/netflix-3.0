import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import BarraNavegacion from '../componentes/BarraNavegacion';
import FilaHorizontal from '../componentes/FilaHorizontal';
import DetalleContenido from './DetalleContenido';
import { obtenerPopulares } from '../servicios/api';

const CHIPS = ['Todo', 'Películas', 'Series', 'Tendencias'];

export default function NuevosPopulares({ onOpenBuscar }) {
  const [chipSeleccionado, setChipSeleccionado] = useState('Todo');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [popularesAll, setPopularesAll] = useState([]);
  const [popularesMovies, setPopularesMovies] = useState([]);
  const [popularesTv, setPopularesTv] = useState([]);
  const [tendenciasDay, setTendenciasDay] = useState([]);
  const [detalleItem, setDetalleItem] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setCargando(true);
        setError(null);
        const [allWeek, moviesWeek, tvWeek, trendDay] = await Promise.all([
          obtenerPopulares({ tipo: 'all', periodo: 'week' }),
          obtenerPopulares({ tipo: 'movie', periodo: 'week' }),
          obtenerPopulares({ tipo: 'tv', periodo: 'week' }),
          obtenerPopulares({ tipo: 'all', periodo: 'day' }),
        ]);
        setPopularesAll(allWeek);
        setPopularesMovies(moviesWeek);
        setPopularesTv(tvWeek);
        setTendenciasDay(trendDay);
      } catch (e) {
        console.error('Error cargando contenido:', e);
        setError('Error al cargar el contenido');
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const contenidoPopular = useMemo(
    () => [...popularesMovies, ...popularesTv],
    [popularesMovies, popularesTv]
  );

  const proximosEstrenos = useMemo(() => popularesAll.slice(0, 10), [popularesAll]);

  const obtenerContenidoFiltrado = () => {
    switch (chipSeleccionado) {
      case 'Películas':
        return popularesMovies;
      case 'Series':
        return popularesTv;
      case 'Tendencias':
        return tendenciasDay;
      default:
        return contenidoPopular;
    }
  };

  if (cargando) {
    return (
      <View style={estilos.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={estilos.loadingText}>Cargando contenido...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={estilos.errorContainer}>
        <StatusBar barStyle="light-content" />
        <Text style={estilos.errorText}>{error}</Text>
        <TouchableOpacity style={estilos.retryButton} onPress={() => {
          setCargando(true);
          setError(null);
        }}>
          <Text style={estilos.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const datosFiltrados = obtenerContenidoFiltrado();

  return (
    <View style={estilos.contenedor}>
      <BarraNavegacion label="Nuevos y popular" onPressBuscar={onOpenBuscar} />

      {/* Título y chips */}
      <View style={estilos.headerChips}>
        {CHIPS.map((chip) => (
          <TouchableOpacity
            key={chip}
            style={[estilos.chip, chipSeleccionado === chip && estilos.chipActivo]}
            onPress={() => setChipSeleccionado(chip)}
          >
            <Text style={[estilos.chipTxt, chipSeleccionado === chip && estilos.chipTxtActivo]}>
              {chip}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        {/* Sección principal según chip */}
        <FilaHorizontal titulo={`Popular - ${chipSeleccionado}`} datos={datosFiltrados} onPressItem={(item) => setDetalleItem(item)} />

        {/* Próximos estrenos solo en "Todo" */}
        {chipSeleccionado === 'Todo' && proximosEstrenos.length > 0 && (
          <FilaHorizontal titulo="Próximos estrenos" datos={proximosEstrenos} onPressItem={(item) => setDetalleItem(item)} />
        )}

        {/* Tendencias como sección adicional si no está filtrando directamente por ella */}
        {chipSeleccionado !== 'Tendencias' && tendenciasDay.length > 0 && (
          <FilaHorizontal titulo="Tendencias hoy" datos={tendenciasDay} onPressItem={(item) => setDetalleItem(item)} />
        )}
      </ScrollView>

      {!!detalleItem && (
        <DetalleContenido item={detalleItem} onCerrar={() => setDetalleItem(null)} />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#141414' },
  headerChips: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)' },
  chipActivo: { backgroundColor: '#fff' },
  chipTxt: { color: '#fff', fontWeight: '600' },
  chipTxtActivo: { color: '#000' },

  loadingContainer: { flex: 1, backgroundColor: '#141414', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#fff', marginTop: 10 },
  errorContainer: { flex: 1, backgroundColor: '#141414', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#fff', marginBottom: 10 },
  retryButton: { backgroundColor: '#E50914', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  retryText: { color: '#fff', fontWeight: '700' },
});