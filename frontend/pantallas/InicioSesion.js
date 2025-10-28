import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ingresarUsuario } from '../servicios/api';
import { useAutenticacion } from '../contextos/ContextoAutenticacion';

const { width } = Dimensions.get('window');

export default function InicioSesion({ onExito, onCancelar, onIrRegistro }) {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const { setToken } = useAutenticacion();

  return (
    <SafeAreaView style={estilos.pantalla}>
      {/* Header */}
      <View style={estilos.header}>
        <TouchableOpacity onPress={onCancelar} style={estilos.headerBack}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={estilos.brand}>NETFLIX</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Contenido centrado */}
      <View style={estilos.contenido}>
        <View style={estilos.formWrap}>
        <TextInput
          placeholder="Email o número de celular"
          placeholderTextColor="#8a8a8a"
          style={estilos.input}
          value={correo}
          onChangeText={setCorreo}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Contraseña"
          placeholderTextColor="#8a8a8a"
          style={estilos.input}
          value={clave}
          onChangeText={setClave}
          secureTextEntry
        />

        {error ? <Text style={estilos.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[estilos.botonRojo, enviando && { opacity: 0.8 }]}
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
          <Text style={estilos.botonTxt}>Iniciar sesión</Text>
        </TouchableOpacity>

        {enviando ? (
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : null}

        <TouchableOpacity style={estilos.botonGris} onPress={() => Alert.alert('Código de inicio', 'Función no implementada aún')}>
          <Text style={estilos.botonGrisTxt}>Usar un código de inicio de sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => Alert.alert('Recuperar contraseña', 'Función no implementada aún')}>
          <Text style={estilos.link}>¿Olvidaste la contraseña?</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', marginTop: 18 }}>
          <Text style={{ color: '#b3b3b3' }}>¿Primera vez en Netflix? </Text>
          <TouchableOpacity onPress={() => (onIrRegistro ? onIrRegistro() : onCancelar?.())}>
            <Text style={estilos.link}>Suscríbete ya</Text>
          </TouchableOpacity>
        </View>

        <Text style={estilos.disclaimer}>
          Esta página está protegida por Google reCAPTCHA para comprobar que no eres un robot.
        </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#000', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 30, },
  header: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBack: { padding: 6 },
  brand: { color: '#E50914', fontWeight: '900', fontSize: 20, letterSpacing: 1 },
  contenido: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  formWrap: { width: Math.min(width * 0.92, 420), alignSelf: 'center' },
  input: {
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
  },
  error: { color: '#ff6b6b', marginBottom: 8 },
  botonRojo: { backgroundColor: '#E50914', borderRadius: 4, paddingVertical: 12, alignItems: 'center' },
  botonTxt: { color: '#fff', fontWeight: '700' },
  botonGris: { backgroundColor: '#333', borderRadius: 4, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  botonGrisTxt: { color: '#fff', fontWeight: '700' },
  link: { color: '#b3b3b3', textDecorationLine: 'underline', marginTop: 14 },
  disclaimer: { color: '#8a8a8a', fontSize: 12, marginTop: 18, lineHeight: 16 },
});