/**
 * Pantalla: MiNetflix
 *
 * Propósito
 * - Hub del usuario: muestra información del perfil, "Mi Lista" y vistos recientemente.
 * - Permite editar/cambiar perfil y accesos a configuraciones (placeholders).
 * - Carga perfiles y lista desde la API usando el token del contexto.
 *
 * Uso
 * - Recibe `onOpenBuscar` para abrir el buscador global.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Image, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BarraNavegacion from '../componentes/BarraNavegacion';
import FilaHorizontal from '../componentes/FilaHorizontal';
import DetalleContenido from './DetalleContenido';
import { useAutenticacion } from '../contextos/ContextoAutenticacion';
import { obtenerMiLista, listarPerfiles, actualizarPerfil } from '../servicios/api';

export default function MiNetflix({ onOpenBuscar }) {
  const { token, setToken, usuario, perfiles, setPerfiles, perfilActual, setPerfilActual } = useAutenticacion();
  const [miLista, setMiLista] = useState([]);
  const [historialVisto, setHistorialVisto] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [detalleItem, setDetalleItem] = useState(null);
  const [mostrarPerfiles, setMostrarPerfiles] = useState(false);
  const [editandoPerfil, setEditandoPerfil] = useState(null);
  const [nuevoNombrePerfil, setNuevoNombrePerfil] = useState('');

  useEffect(() => {
    (async () => {
      if (!token || !perfilActual?.id) {
        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        setError(null);
        
        // Cargar Mi Lista real desde la API
        const cruda = await obtenerMiLista(token, perfilActual.id);
        const lista = (cruda || []).map(i => ({ id: i.contenido_id, titulo: i.titulo, poster: i.poster, tipo: i.tipo }));
        setMiLista(lista);
        
        // Mock para historial visto (se puede implementar después)
        setHistorialVisto(lista.slice(0, 3));
      } catch (e) {
        console.error('Error al cargar Mi Lista:', e);
        setError('Error al cargar los datos del perfil');
      } finally {
        setCargando(false);
      }
    })();
  }, [token, perfilActual?.id]);

  // Cargar perfiles cuando hay token
  useEffect(() => {
    (async () => {
      if (!token) return;
      try {
        const lista = await listarPerfiles(token);
        setPerfiles(lista);
        if (!perfilActual && lista.length) setPerfilActual(lista[0]);
      } catch (e) {
        console.error('Error al listar perfiles:', e);
      }
    })();
  }, [token]);

  const manejarCerrarSesion = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar Sesión', style: 'destructive', onPress: () => setToken(null) },
    ]);
  };

  const manejarCambiarPerfil = (perfil) => {
    setPerfilActual(perfil);
    setMostrarPerfiles(false);
  };

  const manejarEditarPerfil = () => {
    setEditandoPerfil(perfilActual);
    setNuevoNombrePerfil(perfilActual?.nombre || '');
  };

  const guardarEdicionPerfil = async () => {
    try {
      await actualizarPerfil(token, editandoPerfil.id, { nombre: nuevoNombrePerfil });
      // Actualizar en estado local
      const actualizados = perfiles.map(p => p.id === editandoPerfil.id ? { ...p, nombre: nuevoNombrePerfil } : p);
      setPerfiles(actualizados);
      if (perfilActual?.id === editandoPerfil.id) setPerfilActual({ ...perfilActual, nombre: nuevoNombrePerfil });
      setEditandoPerfil(null);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    }
  };

  const manejarConfiguracion = () => Alert.alert('Configuración', 'Función disponible próximamente');
  const manejarDescargas = () => Alert.alert('Descargas', 'Función disponible próximamente');
  const manejarNotificaciones = () => Alert.alert('Notificaciones', 'Función disponible próximamente');

  if (cargando) {
    return (
      <View style={estilos.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={estilos.loadingText}>Cargando perfil...</Text>
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
      <StatusBar barStyle="light-content" />
      <BarraNavegacion label="Mi Netflix" onPressBuscar={onOpenBuscar} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        {/* Perfil del usuario */}
        <View style={estilos.perfilSection}>
          <View style={estilos.perfilHeader}>
            <View style={estilos.avatar}>
              <Ionicons name="person" size={40} color="#111" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={estilos.perfilNombre}>{perfilActual?.nombre || 'Perfil'}</Text>
              <Text style={estilos.perfilCorreo}>Mi Netflix</Text>
            </View>
            <TouchableOpacity onPress={() => setMostrarPerfiles(true)}>
              <Ionicons name="chevron-down" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={estilos.perfilAcciones}>
            <TouchableOpacity style={estilos.accionBtn} onPress={manejarEditarPerfil}>
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={estilos.accionTxt}>Editar perfil</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={estilos.accionBtn} onPress={() => setMostrarPerfiles(true)}>
              <Ionicons name="people-outline" size={18} color="#fff" />
              <Text style={estilos.accionTxt}>Cambiar perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.accionBtn} onPress={manejarConfiguracion}>
              <Ionicons name="settings-outline" size={18} color="#fff" />
              <Text style={estilos.accionTxt}>Configuración</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.accionBtn} onPress={manejarDescargas}>
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={estilos.accionTxt}>Descargas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.accionBtn} onPress={manejarNotificaciones}>
              <Ionicons name="notifications-outline" size={18} color="#fff" />
              <Text style={estilos.accionTxt}>Notificaciones</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[estilos.accionBtn, { backgroundColor: '#E50914' }]} onPress={manejarCerrarSesion}>
              <Ionicons name="log-out-outline" size={18} color="#fff" />
              <Text style={estilos.accionTxt}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mi Lista */}
        <FilaHorizontal titulo="Mi lista" datos={miLista} onPressItem={(item) => setDetalleItem(item)} />

        {/* Vistos recientemente */}
        <FilaHorizontal titulo="Vistos recientemente" datos={historialVisto} onPressItem={(item) => setDetalleItem(item)} />
      </ScrollView>

      {!!detalleItem && (
        <DetalleContenido item={detalleItem} onCerrar={() => setDetalleItem(null)} />
      )}

      {/* Modal Selector de Perfiles */}
      <Modal visible={mostrarPerfiles} transparent animationType="slide">
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitle}>Seleccionar Perfil</Text>
              <TouchableOpacity onPress={() => setMostrarPerfiles(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={estilos.perfilesList}>
              {perfiles?.map((perfil) => (
                <TouchableOpacity
                  key={perfil.id}
                  style={[
                    estilos.perfilItem,
                    perfilActual?.id === perfil.id && estilos.perfilActivo
                  ]}
                  onPress={() => manejarCambiarPerfil(perfil)}
                >
                  <View style={estilos.perfilAvatar}>
                    <Ionicons name="person" size={24} color="#111" />
                  </View>
                  <Text style={estilos.perfilItemNombre}>{perfil.nombre}</Text>
                  {perfilActual?.id === perfil.id && (
                    <Ionicons name="checkmark" size={20} color="#E50914" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Editar Perfil */}
      <Modal visible={!!editandoPerfil} transparent animationType="slide">
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setEditandoPerfil(null)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={estilos.editForm}>
              <Text style={estilos.inputLabel}>Nombre del perfil:</Text>
              <TextInput
                style={estilos.inputText}
                placeholder="Nombre"
                placeholderTextColor="#888"
                value={nuevoNombrePerfil}
                onChangeText={setNuevoNombrePerfil}
              />
              <TouchableOpacity style={[estilos.editButton, { marginTop: 12 }]} onPress={guardarEdicionPerfil}>
                <Text style={estilos.editButtonText}>Guardar</Text>
                <Ionicons name="checkmark" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  perfilSection: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6 },
  perfilHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  perfilNombre: { color: '#fff', fontSize: 18, fontWeight: '800' },
  perfilCorreo: { color: '#bbb', marginTop: 2 },
  perfilAcciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  accionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  accionTxt: { color: '#fff', fontWeight: '700' },

  // Estilos para modales
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#222', borderRadius: 12, width: '90%', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#333' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  // Estilos para selector de perfiles
  perfilesList: { maxHeight: 300 },
  perfilItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
  perfilActivo: { backgroundColor: 'rgba(229, 9, 20, 0.1)' },
  perfilAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  perfilItemNombre: { color: '#fff', fontSize: 16, flex: 1 },
  
  // Estilos para editar perfil
  editForm: { padding: 20 },
  inputLabel: { color: '#fff', fontSize: 16, marginBottom: 10 },
  inputText: { backgroundColor: '#333', color: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  editButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#333', padding: 16, borderRadius: 8 },
  editButtonText: { color: '#fff', fontSize: 16 },
});