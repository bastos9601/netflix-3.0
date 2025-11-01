/**
 * Pantalla: InicioSesion
 *
 * Propósito
 * - Permite iniciar sesión con contraseña, login sin contraseña vía código y flujo de restablecimiento.
 * - Usa el contexto de autenticación para almacenar el token al ingresar.
 *
 * Uso
 * - Modo `password`: email + contraseña.
 * - Modo `codigo`: solicita y valida código de 6 dígitos enviado al correo.
 * - Modo `reset`: solicita token de restablecimiento y define nueva contraseña.
 *
 * Props clave
 * - `onExito`: callback cuando se ingresa correctamente.
 * - `onCancelar`: volver atrás.
 * - `onIrRegistro`: navegación hacia registro.
 */

// Función de login (modo contraseña):
//             - Se ejecuta desde el onPress del botón "Iniciar sesión".
//             - Llama a ingresarUsuario({ correo, clave }) de servicios/api.
//             - Si la respuesta trae token: setToken(token) y onExito?.() para continuar.
//             - Maneja errores de red y credenciales; deshabilita el botón con "enviando".


import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ingresarUsuario, solicitarCodigoLogin, ingresarConCodigo, solicitarResetClave, restablecerClave } from '../servicios/api';
import { useAutenticacion } from '../contextos/ContextoAutenticacion';

const { width } = Dimensions.get('window');

export default function InicioSesion({ onExito, onCancelar, onIrRegistro }) {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [modo, setModo] = useState('password'); // 'password' | 'codigo' | 'reset'
  const [codigo, setCodigo] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [tokenReset, setTokenReset] = useState('');
  
  const [nuevaClave, setNuevaClave] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [resetEnviado, setResetEnviado] = useState(false);
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
        {modo === 'password' && (
          <>
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
          </>
        )}

        {modo === 'codigo' && (
          <>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#8a8a8a"
              style={estilos.input}
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {codigoEnviado && (
              <TextInput
                placeholder="Código de 6 dígitos"
                placeholderTextColor="#8a8a8a"
                style={estilos.input}
                value={codigo}
                onChangeText={setCodigo}
                keyboardType="number-pad"
                maxLength={6}
              />
            )}
            {!!mensaje && <Text style={{ color: '#9be59b', marginBottom: 8 }}>{mensaje}</Text>}
          </>
        )}

        {modo === 'reset' && (
          <>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#8a8a8a"
              style={estilos.input}
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {resetEnviado && (
              <TextInput
                placeholder="Token de restablecimiento"
                placeholderTextColor="#8a8a8a"
                style={estilos.input}
                value={tokenReset}
                onChangeText={setTokenReset}
                autoCapitalize="none"
              />
            )}
            {resetEnviado && (
              <TextInput
                placeholder="Nueva contraseña"
                placeholderTextColor="#8a8a8a"
                style={estilos.input}
                value={nuevaClave}
                onChangeText={setNuevaClave}
                secureTextEntry
              />
            )}
            {!!mensaje && <Text style={{ color: '#9be59b', marginBottom: 8 }}>{mensaje}</Text>}
          </>
        )}

        {error ? <Text style={estilos.error}>{error}</Text> : null}

        {modo === 'password' && (
          //funcion del boton iniciar secion
          <TouchableOpacity
            style={[estilos.botonRojo, enviando && { opacity: 0.8 }]}
            disabled={enviando}
            onPress={async () => {
              try {
                setEnviando(true);//Indica que el proceso de inicio está en curso
                setError(''); //Limpia errores previos
                //Verifica que el usuario haya llenado el correo y la clave.
                //Si falta alguno, muestra un mensaje de error y detiene la ejecución
                if (!correo || !clave) {
                  setError('Completa correo y clave.');
                  return;
                }  
                //Llama a la función ingresarUsuario (probablemente hace una petición al servidor).
                const { token } = await ingresarUsuario({ correo, clave });
                setToken(token); //Si la respuesta incluye un token, se guarda con setToken(token) (ese token se usa para mantener la sesión activa).
                onExito?.(); //llama cuando el inicio de sesión fue exitoso
                //Si algo falla (por ejemplo, conexión o credenciales incorrectas), muestra un mensaje apropiado.
              } catch (e) {
                const msg = (e && e.message) || '';
                //Distingue entre error de red y error de autenticación.
                if (msg.includes('Network request failed')) {
                  setError('No se pudo conectar al servidor. Revisa tu red/BASE_URL.');
                } else {
                  setError('Credenciales inválidas o error al ingresar.');
                }
                
              } finally   {  
                setEnviando(false); //para reactivar el botón y volverlo a usar.
              }
            }}
          >
            <Text style={estilos.botonTxt}>Iniciar sesión</Text>
          </TouchableOpacity>
        )}

        {modo === 'codigo' && (
          !codigoEnviado ? (
            <TouchableOpacity
              style={[estilos.botonRojo, enviando && { opacity: 0.8 }]}
              disabled={enviando}
            onPress={async () => {
                try {
                  setEnviando(true);
                  setError('');
                  if (!correo) { setError('Ingresa tu correo.'); return; }
                  await solicitarCodigoLogin({ correo });
                  setCodigoEnviado(true);
                  setMensaje('Te enviamos un código a tu correo. Revísalo e introdúcelo aquí.');
                } catch (e) {
                  setError(e.message || 'Error al solicitar código');
                } finally {
                  setEnviando(false);
                }
              }}
            >
              <Text style={estilos.botonTxt}>Enviar código</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[estilos.botonRojo, enviando && { opacity: 0.8 }]}
              disabled={enviando}
            onPress={async () => {
                try {
                  setEnviando(true);
                  setError('');
                  if (!correo || !codigo) { setError('Ingresa correo y código.'); return; }
                  const { token } = await ingresarConCodigo({ correo, codigo });
                  setToken(token);
                  onExito?.();
                } catch (e) {
                  setError(e.message || 'Código inválido');
                } finally {
                  setEnviando(false);
                }
              }}
            >
              <Text style={estilos.botonTxt}>Ingresar con código</Text>
            </TouchableOpacity>
          )
        )}

        {modo === 'reset' && (
          !tokenReset ? (
            <TouchableOpacity
              style={[estilos.botonRojo, enviando && { opacity: 0.8 }]}
              disabled={enviando}
              onPress={async () => {
                // Paso 1: solicitar token/enlace de restablecimiento al correo
                try {
                  setEnviando(true);
                  setError('');
                  if (!correo) { setError('Ingresa tu correo.'); return; }
                  await solicitarResetClave({ correo });
                  setResetEnviado(true);
                  setMensaje('Te enviamos un token de restablecimiento a tu correo.');
                } catch (e) {
                  setError(e.message || 'No se pudo solicitar el restablecimiento');
                } finally {
                  setEnviando(false);
                }
              }}
            >
              <Text style={estilos.botonTxt}>Enviar enlace/código</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[estilos.botonRojo, enviando && { opacity: 0.8 }]}
              disabled={enviando}
              onPress={async () => {
                // Paso 2: enviar token y nueva clave para actualizar
                try {
                  setEnviando(true);
                  setError('');
                  if (!tokenReset || !nuevaClave) { setError('Completa token y nueva contraseña.'); return; }
                  await restablecerClave({ token: tokenReset, nueva_clave: nuevaClave });
                  // Cambiar a modo password tras restablecer
                  setModo('password');
                  setClave('');
                  setNuevaClave('');
                  setTokenReset('');
                  setResetEnviado(false);
                  setError('Contraseña actualizada. Inicia sesión con tu nueva clave.');
                } catch (e) {
                  setError(e.message || 'No se pudo restablecer la contraseña');
                } finally {
                  setEnviando(false);
                }
              }}
            >
              <Text style={estilos.botonTxt}>Restablecer contraseña</Text>
            </TouchableOpacity>
          )
        )}

        {enviando ? (
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : null}

        <TouchableOpacity style={estilos.botonGris} onPress={() => { setError(''); setMensaje(''); setCodigo(''); setCodigoEnviado(false); setModo('codigo'); }}>
          <Text style={estilos.botonGrisTxt}>Usar un código de inicio de sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setError(''); setMensaje(''); setModo('reset'); setResetEnviado(false); setTokenReset(''); setNuevaClave(''); }}>
          <Text style={estilos.link}>¿Olvidaste la contraseña?</Text>
        </TouchableOpacity>

        {modo !== 'password' && (
          <TouchableOpacity onPress={() => { setModo('password'); setError(''); setMensaje(''); setCodigo(''); setCodigoEnviado(false); setTokenReset(''); setNuevaClave(''); setResetEnviado(false); }}>
            <Text style={[estilos.link, { marginTop: 10 }]}>Volver a inicio de sesión</Text>
          </TouchableOpacity>
        )}

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