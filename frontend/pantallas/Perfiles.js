/**
 * Pantalla: Perfiles
 *
 * Propósito
 * - Lista los perfiles del usuario y permite seleccionar uno para continuar.
 * - Ofrece agregar/editar/eliminar perfiles (edición local y eliminación vía API).
 *
 * Uso
 * - Recibe `onElegir` como callback al seleccionar un perfil.
 */

// Importamos React y los hooks necesarios para manejar estado y efectos
import React, { useEffect, useMemo, useState } from 'react';

// Importamos componentes de React Native para la interfaz de usuario
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';

// Importamos funciones de la API para manejar perfiles (listar, crear, eliminar)
import { listarPerfiles, crearPerfil, eliminarPerfil } from '../servicios/api';

// Importamos el contexto de autenticación para obtener el token del usuario
import { useAutenticacion } from '../contextos/ContextoAutenticacion';

// Constante que define los avatares disponibles como emojis de animales
const AVATARES = ['🦊', '🐼', '🐨', '🐯', '🐵', '🐶'];

// Componente principal que recibe onElegir como prop (función callback)
export default function Perfiles({ onElegir }) {
  // Obtenemos el token de autenticación del contexto
  const { token } = useAutenticacion();
  
  // Estado para almacenar la lista de perfiles del usuario
  const [perfiles, setPerfiles] = useState([]);
  
  // Estado para controlar si estamos cargando datos
  const [cargando, setCargando] = useState(true);
  
  // Estado para manejar mensajes de error
  const [error, setError] = useState('');
  
  // Estado para controlar la visibilidad del modal de crear/editar perfil
  const [modalVisible, setModalVisible] = useState(false);
  
  // Estado para el nombre del nuevo perfil o perfil editado
  const [nuevoNombre, setNuevoNombre] = useState('');
  
  // Estado para el avatar seleccionado (por defecto el primer emoji)
  const [avatarSel, setAvatarSel] = useState(AVATARES[0]);
  
  // Estado para activar/desactivar el modo de edición
  const [modoEditar, setModoEditar] = useState(false);
  
  // Estado para almacenar el perfil que se está editando actualmente
  const [perfilEditando, setPerfilEditando] = useState(null);

  // useEffect se ejecuta cuando el componente se monta y cuando cambia el token
  useEffect(() => {
    // Función asíncrona autoejecutable para cargar perfiles
    (async () => {
      try {
        // Activamos el estado de carga
        setCargando(true);
        
        // Llamamos a la API para obtener la lista de perfiles
        const datos = await listarPerfiles(token);
        
        // Guardamos los perfiles en el estado
        setPerfiles(datos);
      } catch (e) {
        // Si hay error, mostramos mensaje de error
        setError('No se pudieron cargar perfiles.');
      } finally {
        // Siempre desactivamos el estado de carga al final
        setCargando(false);
      }
    })();
  }, [token]); // Se ejecuta cuando cambia el token

  // useMemo optimiza el rendimiento memorizando el array de perfiles
  // Solo se recalcula cuando cambia el array de perfiles
  const data = useMemo(() => perfiles, [perfiles]);

  // Función que renderiza cada elemento de la lista de perfiles
  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        // Aplicamos estilos base y condicionales (si está en modo editar)
        style={[estilos.tile, modoEditar && estilos.tileEditar]}
        onPress={() => {
          // Si estamos en modo editar
          if (modoEditar) {
            // Configuramos el perfil para editar
            setPerfilEditando(item);
            setNuevoNombre(item.nombre);
            setAvatarSel(item.avatar || AVATARES[0]);
            // Abrimos el modal de edición
            setModalVisible(true);
          } else {
            // Si no estamos editando, ejecutamos el callback onElegir
            // El operador ?. evita errores si onElegir es undefined
            onElegir?.(item);
          }
        }}
      >
        {/* Círculo que contiene el avatar del perfil */}
        <View style={estilos.circulo}>
          <Text style={estilos.avatarTxt}>{item.avatar || '🐼'}</Text>
        </View>
        {/* Nombre del perfil */}
        <Text style={estilos.nombre}>{item.nombre}</Text>
      </TouchableOpacity>
    );
  };

  // Renderizado principal del componente
  return (
    <View style={estilos.contenedor}>
      {/* Área superior con icono de bloqueo */}
      <View style={estilos.lockArea}>
        <Text style={estilos.lockEmoji}>🛡️</Text>
        <Text style={estilos.lockTxt}>Bloqueo de perfil ACTIVADO</Text>
      </View>

      {/* Panel inferior que contiene la lista de perfiles y botones */}
      <View style={estilos.panelInferior}>
        <Text style={estilos.subtitulo}>Elige tu perfil</Text>
        
        {/* Mostramos mensaje de error si existe */}
        {error ? <Text style={estilos.error}>{error}</Text> : null}
        
        {/* Renderizado condicional: mensaje de carga o lista de perfiles */}
        {cargando ? (
          <Text style={{ color: '#aaa', textAlign: 'center' }}>Cargando perfiles…</Text>
        ) : (
          <FlatList
            data={data} // Datos de los perfiles
            keyExtractor={(it) => String(it.id)} // Función para generar keys únicas
            renderItem={renderItem} // Función que renderiza cada elemento
            horizontal // Lista horizontal
            showsHorizontalScrollIndicator={false} // Oculta indicador de scroll
            contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 }}
          />
        )}

        {/* Botones de acción en la parte inferior */}
        <View style={estilos.bottomBtns}>
          {/* Botón para agregar nuevo perfil */}
          <TouchableOpacity 
            style={estilos.btnAccion} 
            onPress={() => { 
              // Limpiamos los estados y abrimos modal para crear nuevo perfil
              setPerfilEditando(null); 
              setNuevoNombre(''); 
              setAvatarSel(AVATARES[0]); 
              setModalVisible(true); 
            }}
          >
            <Text style={estilos.btnIcon}>＋</Text>
            <Text style={estilos.btnLabel}>Agregar</Text>
          </TouchableOpacity>
          
          {/* Botón para activar/desactivar modo edición */}
          <TouchableOpacity 
            style={estilos.btnAccion} 
            onPress={() => setModoEditar((v) => !v)} // Invierte el estado actual
          >
            <Text style={estilos.btnIcon}>✎</Text>
            <Text style={estilos.btnLabel}>Editar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal para crear/editar perfiles */}
      <Modal 
        visible={modalVisible} // Controla si el modal está visible
        transparent // Fondo transparente
        animationType="fade" // Animación de aparición
        onRequestClose={() => setModalVisible(false)} // Función al cerrar (Android)
      >
        {/* Fondo semitransparente del modal */}
        <View style={estilos.modalFondo}>
          {/* Tarjeta principal del modal */}
          <View style={estilos.modalCard}>
            {/* Título dinámico según si estamos editando o creando */}
            <Text style={estilos.modalTitulo}>
              {perfilEditando ? 'Editar perfil' : 'Crear nuevo perfil'}
            </Text>
            
            {/* Campo de texto para el nombre del perfil */}
            <TextInput
              placeholder="Nombre del perfil"
              placeholderTextColor="#8a8a8a"
              style={estilos.input}
              value={nuevoNombre} // Valor controlado por el estado
              onChangeText={setNuevoNombre} // Actualiza el estado al escribir
            />
            
            {/* Fila de avatares para seleccionar */}
            <View style={estilos.avataresFila}>
              {AVATARES.map((a) => (
                <TouchableOpacity 
                  key={a} // Key única para cada avatar
                  // Estilos condicionales: resalta el avatar seleccionado
                  style={[estilos.avatarOpc, avatarSel === a && estilos.avatarSel]} 
                  onPress={() => setAvatarSel(a)} // Selecciona este avatar
                >
                  <Text style={estilos.avatarTxt}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Fila de botones de acción del modal */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, justifyContent: 'space-between' }}>
              
              {/* Botón Cancelar */}
              <TouchableOpacity 
                style={estilos.btnCancelar} 
                onPress={() => setModalVisible(false)} // Cierra el modal sin guardar
              >
                <Text style={estilos.btnTxt}>Cancelar</Text>
              </TouchableOpacity>
              
              {/* Botón Crear/Guardar */}
              <TouchableOpacity
                style={estilos.btnCrear}
                onPress={async () => {
                  try {
                    // Validación: no permitir nombres vacíos
                    if (!nuevoNombre.trim()) return;
                    
                    if (!perfilEditando) {
                      // CREAR: Llamamos a la API para crear un nuevo perfil
                      await crearPerfil(token, { 
                        nombre: nuevoNombre.trim(), 
                        avatar: avatarSel 
                      });
                    } else {
                      // EDITAR: Actualización local (el backend no tiene endpoint de actualización)
                      setPerfiles((prev) => 
                        prev.map((p) => 
                          p.id === perfilEditando.id 
                            ? { ...p, nombre: nuevoNombre.trim(), avatar: avatarSel } 
                            : p
                        )
                      );
                    }
                    
                    // Cerramos modal y limpiamos estados
                    setModalVisible(false);
                    setPerfilEditando(null);
                    setNuevoNombre('');
                    
                    // Recargamos la lista de perfiles desde el servidor
                    const datos = await listarPerfiles(token).catch(() => null);
                    if (datos) setPerfiles(datos);
                    
                  } catch (e) {
                    // Manejo de errores con mensajes específicos
                    setError(perfilEditando ? 'No se pudo editar el perfil' : 'No se pudo crear el perfil');
                  }
                }}
              >
                {/* Texto dinámico del botón según la acción */}
                <Text style={estilos.btnTxt}>{perfilEditando ? 'Guardar' : 'Crear'}</Text>
              </TouchableOpacity>
              
              {/* Botón Eliminar (solo visible cuando estamos editando) */}
              {perfilEditando && (
                <TouchableOpacity
                  style={estilos.btnEliminar}
                  onPress={async () => {
                    try {
                      // Llamamos a la API para eliminar el perfil
                      await eliminarPerfil(token, perfilEditando.id);
                      
                      // Cerramos modal y limpiamos estados
                      setModalVisible(false);
                      setPerfilEditando(null);
                      
                      // Recargamos la lista actualizada desde el servidor
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