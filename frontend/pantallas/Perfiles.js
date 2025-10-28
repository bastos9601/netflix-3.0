import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import { listarPerfiles, crearPerfil, eliminarPerfil } from '../servicios/api';
import { useAutenticacion } from '../contextos/ContextoAutenticacion';

const AVATARES = ['🦊', '🐼', '🐨', '🐯', '🐵', '🐶'];

export default function Perfiles({ onElegir }) {
  const { token } = useAutenticacion();
  const [perfiles, setPerfiles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [avatarSel, setAvatarSel] = useState(AVATARES[0]);
  const [modoEditar, setModoEditar] = useState(false);
  const [perfilEditando, setPerfilEditando] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setCargando(true);
        const datos = await listarPerfiles(token);
        setPerfiles(datos);
      } catch (e) {
        setError('No se pudieron cargar perfiles.');
      } finally {
        setCargando(false);
      }
    })();
  }, [token]);

  const data = useMemo(() => perfiles, [perfiles]);

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={[estilos.tile, modoEditar && estilos.tileEditar]}
        onPress={() => {
          if (modoEditar) {
            setPerfilEditando(item);
            setNuevoNombre(item.nombre);
            setAvatarSel(item.avatar || AVATARES[0]);
            setModalVisible(true);
          } else {
            onElegir?.(item);
          }
        }}
      >
        <View style={estilos.circulo}><Text style={estilos.avatarTxt}>{item.avatar || '🐼'}</Text></View>
        <Text style={estilos.nombre}>{item.nombre}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.lockArea}>
        <Text style={estilos.lockEmoji}>🛡️</Text>
        <Text style={estilos.lockTxt}>Bloqueo de perfil ACTIVADO</Text>
      </View>

      <View style={estilos.panelInferior}>
        <Text style={estilos.subtitulo}>Elige tu perfil</Text>
        {error ? <Text style={estilos.error}>{error}</Text> : null}
        {cargando ? (
          <Text style={{ color: '#aaa', textAlign: 'center' }}>Cargando perfiles…</Text>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(it) => String(it.id)}
            renderItem={renderItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 }}
          />
        )}

        <View style={estilos.bottomBtns}>
          <TouchableOpacity style={estilos.btnAccion} onPress={() => { setPerfilEditando(null); setNuevoNombre(''); setAvatarSel(AVATARES[0]); setModalVisible(true); }}>
            <Text style={estilos.btnIcon}>＋</Text>
            <Text style={estilos.btnLabel}>Agregar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.btnAccion} onPress={() => setModoEditar((v) => !v)}>
            <Text style={estilos.btnIcon}>✎</Text>
            <Text style={estilos.btnLabel}>Editar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={estilos.modalFondo}>
          <View style={estilos.modalCard}>
            <Text style={estilos.modalTitulo}>{perfilEditando ? 'Editar perfil' : 'Crear nuevo perfil'}</Text>
            <TextInput
              placeholder="Nombre del perfil"
              placeholderTextColor="#8a8a8a"
              style={estilos.input}
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
            />
            <View style={estilos.avataresFila}>
              {AVATARES.map((a) => (
                <TouchableOpacity key={a} style={[estilos.avatarOpc, avatarSel === a && estilos.avatarSel]} onPress={() => setAvatarSel(a)}>
                  <Text style={estilos.avatarTxt}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, justifyContent: 'space-between' }}>
              <TouchableOpacity style={estilos.btnCancelar} onPress={() => setModalVisible(false)}>
                <Text style={estilos.btnTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={estilos.btnCrear}
                onPress={async () => {
                  try {
                    if (!nuevoNombre.trim()) return;
                    if (!perfilEditando) {
                      await crearPerfil(token, { nombre: nuevoNombre.trim(), avatar: avatarSel });
                    } else {
                      // Edición local (backend no tiene endpoint de actualización)
                      setPerfiles((prev) => prev.map((p) => p.id === perfilEditando.id ? { ...p, nombre: nuevoNombre.trim(), avatar: avatarSel } : p));
                    }
                    setModalVisible(false);
                    setPerfilEditando(null);
                    setNuevoNombre('');
                    const datos = await listarPerfiles(token).catch(() => null);
                    if (datos) setPerfiles(datos);
                  } catch (e) {
                    setError(perfilEditando ? 'No se pudo editar el perfil' : 'No se pudo crear el perfil');
                  }
                }}
              >
                <Text style={estilos.btnTxt}>{perfilEditando ? 'Guardar' : 'Crear'}</Text>
              </TouchableOpacity>
              {perfilEditando && (
                <TouchableOpacity
                  style={estilos.btnEliminar}
                  onPress={async () => {
                    try {
                      await eliminarPerfil(token, perfilEditando.id);
                      setModalVisible(false);
                      setPerfilEditando(null);
                      const datos = await listarPerfiles(token);
                      setPerfiles(datos);
                    } catch (e) {
                      setError('No se pudo eliminar el perfil');
                    }
                  }}
                >
                  <Text style={estilos.btnTxt}>Eliminar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#141414', alignItems: 'center', paddingTop: 40 },
  lockArea: { alignItems: 'center', marginBottom: 16 },
  lockEmoji: { fontSize: 48 },
  lockTxt: { color: '#fff', marginTop: 8 },
  titulo: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  panelInferior: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#101010',
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  subtitulo: { color: '#ccc', marginBottom: 8 },
  error: { color: '#ff6b6b', marginBottom: 8 },
  tile: { alignItems: 'center', marginHorizontal: 12, backgroundColor: '#1b1b1b', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#333' },
  tileEditar: { opacity: 0.9, borderColor: '#E50914' },
  tileAgregar: { alignItems: 'center', margin: 12, opacity: 0.9 },
  circulo: { width: 76, height: 76, borderRadius: 12, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#444' },
  circuloAgregar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#666' },
  nombre: { color: '#ccc', marginTop: 6 },
  mas: { color: '#bbb', fontSize: 36, fontWeight: 'bold' },
  bottomBtns: { flexDirection: 'row', gap: 16, marginTop: 10 },
  btnAccion: { alignItems: 'center', justifyContent: 'center', width: 96, height: 96, backgroundColor: '#1f1f1f', borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  btnIcon: { color: '#bbb', fontSize: 28, marginBottom: 6 },
  btnLabel: { color: '#aaa' },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: 320, backgroundColor: '#111', borderRadius: 8, padding: 16 },
  modalTitulo: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  input: { backgroundColor: '#1f1f1f', borderWidth: 1, borderColor: '#333', color: '#fff', borderRadius: 6, paddingHorizontal: 12, height: 42, marginBottom: 10 },
  avataresFila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  avatarOpc: { width: 48, height: 48, borderRadius: 6, backgroundColor: '#1f1f1f', alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#333' },
  avatarSel: { borderColor: '#E50914' },
  avatarTxt: { color: '#fff', fontSize: 24 },
  btnCrear: { backgroundColor: '#E50914', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 16 },
  btnCancelar: { backgroundColor: '#333', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 16 },
  btnEliminar: { backgroundColor: '#7a1f1f', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#a33' },
  btnTxt: { color: '#fff', fontWeight: 'bold' },
});