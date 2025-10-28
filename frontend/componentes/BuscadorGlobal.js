import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Image, StyleSheet } from 'react-native';
import { buscarContenidos } from '../servicios/api';

export default function BuscadorGlobal({ visible, onClose, onSelectItem }) {
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const ejecutarBusqueda = async (searchQuery = q) => {
    const term = (searchQuery || '').trim();
    if (term === '') {
      setResultados([]);
      return;
    }

    setBuscando(true);
    try {
      const data = await buscarContenidos({ q: term, tipo: 'multi' });
      setResultados(data || []);
    } catch (error) {
      console.error('Error al buscar contenidos:', error);
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  };

  const buscarConDebounce = (text) => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => ejecutarBusqueda(text), 500);
    setTimeoutId(id);
  };

  const handleClose = () => {
    setQ('');
    setResultados([]);
    setBuscando(false);
    if (timeoutId) clearTimeout(timeoutId);
    onClose && onClose();
  };

  return (
    <Modal visible={!!visible} transparent animationType="fade">
      <View style={estilos.modalOverlay}>
        <View style={estilos.modalContent}>
          {/* Header con barra de búsqueda */}
          <View style={estilos.searchHeader}>
            <TouchableOpacity style={estilos.backButton} onPress={handleClose}>
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
                  const t = text.trim();
                  if (t.length > 2) {
                    buscarConDebounce(text);
                  } else if (t.length === 0) {
                    setResultados([]);
                    setBuscando(false);
                  }
                }}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={() => ejecutarBusqueda(q)}
              />
              {q.length > 0 && (
                <TouchableOpacity style={estilos.clearButton} onPress={() => { setQ(''); setResultados([]); }}>
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
                        onSelectItem && onSelectItem(item);
                        handleClose();
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
  );
}

const estilos = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: '#000' },
  modalContent: { flex: 1, backgroundColor: '#000' },
  searchHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 50, backgroundColor: '#000', borderBottomWidth: 1, borderBottomColor: '#333'
  },
  backButton: { marginRight: 16, padding: 8 },
  backIcon: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', borderRadius: 8, paddingHorizontal: 12, height: 44 },
  searchIcon: { fontSize: 16, marginRight: 8, color: '#666' },
  searchInput: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 0 },
  clearButton: { padding: 4 },
  clearIcon: { color: '#666', fontSize: 16 },
  searchContent: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  loadingText: { color: '#fff', fontSize: 16, marginTop: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { color: '#666', fontSize: 16, textAlign: 'center' },
  noResults: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  noResultsIcon: { fontSize: 64, marginBottom: 16 },
  noResultsTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  noResultsSubtitle: { color: '#666', fontSize: 16, textAlign: 'center' },
  resultsContainer: { paddingHorizontal: 16, paddingTop: 16 },
  resultsTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  resultsGrid: { paddingBottom: 32 },
  resultItem: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#111', borderRadius: 8, overflow: 'hidden' },
  resultPoster: { width: 100, height: 150, backgroundColor: '#333' },
  posterPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderIcon: { fontSize: 32, color: '#666' },
  resultInfo: { flex: 1, padding: 12, justifyContent: 'flex-start' },
  resultTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  resultType: { color: '#E50914', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  resultDescription: { color: '#ccc', fontSize: 13, lineHeight: 18 },
});