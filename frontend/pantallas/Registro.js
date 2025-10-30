/**
 * Pantalla: Registro
 *
 * Propósito
 * - Permite crear una cuenta pidiendo nombre, email y contraseña.
 * - Tras registrar, intenta iniciar sesión automáticamente y guarda el token.
 *
 * Uso
 * - Recibe `onCancel` para volver y `onExito` tras completar el registro/login.
 */
import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { registrarUsuario, ingresarUsuario } from '../servicios/api';
import { useAutenticacion } from '../contextos/ContextoAutenticacion';

const { width } = Dimensions.get('window');

export default function Registro({ onCancel, onExito }) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const { setToken } = useAutenticacion();

  return (
    <SafeAreaView style={estilos.pantalla}>
      {/* Header con flecha para volver */}
      <View style={estilos.header}>
        <TouchableOpacity onPress={onCancel} style={estilos.headerBack}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Contenido centrado */}
      <View style={estilos.contenido}>
        <View style={estilos.card}>
        <Text style={estilos.titulo}>¿Quieres ver Netflix ya?</Text>
        <Text style={estilos.subtitulo}>Ingresa tu nombre, email y contraseña para crear tu cuenta.</Text>

        <TextInput
          placeholder="Nombre"
          placeholderTextColor="#8a8a8a"
          style={estilos.input}
          value={nombre}
          onChangeText={setNombre}
        />
        <TextInput
          placeholder="Email"
          placeholderTextColor="#8a8a8a"
          style={estilos.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={correo}
          onChangeText={setCorreo}
        />
        <TextInput
          placeholder="Contraseña"
          placeholderTextColor="#8a8a8a"
          style={estilos.input}
          secureTextEntry
          value={clave}
          onChangeText={setClave}
        />
        {error ? <Text style={estilos.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[estilos.boton, enviando && { opacity: 0.75 }]}
          disabled={enviando}
          onPress={async () => {
            try {
              setEnviando(true);
              setError('');
              if (!nombre || !correo || !clave) {
                setError('Completa todos los campos.');
                return;
              }
              await registrarUsuario({ nombre, correo, clave });
              // Iniciar sesión automáticamente tras registrar
              try {
                const login = await ingresarUsuario({ correo, clave });
                if (login?.token) {
                  setToken(login.token);
                  onExito?.();
                } else {
                  setError('Cuenta creada, pero no se pudo iniciar sesión automáticamente.');
                }
              } catch (eLogin) {
                console.error('Auto-login falló:', eLogin);
                setError('Cuenta creada, pero hubo un problema al iniciar sesión. Intenta desde "Iniciar sesión".');
              }
            } catch (e) {
              console.error('Error registro:', e);
              const msg = (e && e.message) || '';
              if (msg.includes('Network request failed')) {
                setError('No se pudo conectar al servidor. Verifica tu red y BASE_URL.');
              } else {
                setError('No se pudo crear la cuenta.');
              }
            } finally {
              setEnviando(false);
            }
          }}
        >
          <Text style={estilos.botonTxt}>Comienza ya</Text>
        </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#000', paddingHorizontal: 16, paddingTop: 8 },
  header: { height: 48, justifyContent: 'center'  },
  headerBack: { paddingHorizontal: 6, paddingVertical: 6, alignSelf: 'flex-start' },
  contenido: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: Math.min(width * 0.92, 420),
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 8,
  },
  titulo: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  subtitulo: { color: '#ccc', marginBottom: 14 },
  input: {
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
  },
  error: { color: '#ff6b6b', marginBottom: 10 },
  boton: { backgroundColor: '#E50914', borderRadius: 6, paddingVertical: 12 },
  botonTxt: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});