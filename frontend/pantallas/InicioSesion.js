import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { ingresarUsuario } from '../servicios/api';
import { useAutenticacion } from '../contextos/ContextoAutenticacion';

const { width } = Dimensions.get('window');

export default function InicioSesion({ onExito, onCancelar }) {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const { setToken } = useAutenticacion();

  return (
    <SafeAreaView style={estilos.pantalla}>
      <View style={estilos.card}>
        <Text style={estilos.titulo}>Iniciar sesión</Text>
        <TextInput
          placeholder="Correo"
          placeholderTextColor="#8a8a8a"
          style={estilos.input}
          value={correo}
          onChangeText={setCorreo}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Clave"
          placeholderTextColor="#8a8a8a"
          style={estilos.input}
          value={clave}
          onChangeText={setClave}
          secureTextEntry
        />
        {error ? <Text style={estilos.error}>{error}</Text> : null}
        <TouchableOpacity
          style={[estilos.boton, enviando && { opacity: 0.75 }]}
          disabled={enviando}
          onPress={async () => {
            try {
              setEnviando(true);
              setError('');
              if (!correo || !clave) {
                setError('Completa correo y clave.');
                return;
              }
              const { token } = await ingresarUsuario({ correo, clave });
              setToken(token);
              onExito?.();
            } catch (e) {
              const msg = (e && e.message) || '';
              if (msg.includes('Network request failed')) {
                setError('No se pudo conectar al servidor. Revisa tu red/BASE_URL.');
              } else {
                setError('Credenciales inválidas o error al ingresar.');
              }
            } finally {
              setEnviando(false);
            }
          }}
        >
          <Text style={estilos.botonTxt}>INGRESAR</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  card: {
    width: Math.min(width * 0.92, 420),
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 8,
  },
  titulo: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
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
  error: { color: '#ff6b6b', marginBottom: 8 },
  boton: { backgroundColor: '#E50914', borderRadius: 6, paddingVertical: 12 },
  botonTxt: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});