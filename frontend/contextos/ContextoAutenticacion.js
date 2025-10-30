// Contexto de Autenticación:
// Provee estado global: token, usuario, perfiles y perfil activo.
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Contexto = createContext(null);

export function ProveedorAutenticacion({ children }) {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [perfiles, setPerfiles] = useState([]);
  const [perfilActual, setPerfilActual] = useState(null);

  // Cargar sesión almacenada al iniciar
  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('auth.token');
        const p = await AsyncStorage.getItem('auth.perfilActual');
        if (t) setToken(t);
        if (p) setPerfilActual(JSON.parse(p));
      } catch (e) {
        // noop
      }
    })();
  }, []);

  // Persistir cambios de sesión
  useEffect(() => {
    (async () => {
      try {
        if (token) {
          await AsyncStorage.setItem('auth.token', token);
        } else {
          await AsyncStorage.removeItem('auth.token');
        }
      } catch (_) {}
    })();
  }, [token]);

  useEffect(() => {
    (async () => {
      try {
        if (perfilActual) {
          await AsyncStorage.setItem('auth.perfilActual', JSON.stringify(perfilActual));
        } else {
          await AsyncStorage.removeItem('auth.perfilActual');
        }
      } catch (_) {}
    })();
  }, [perfilActual]);

  const cerrarSesion = async () => {
    try {
      await AsyncStorage.removeItem('auth.token');
      await AsyncStorage.removeItem('auth.perfilActual');
    } catch (_) {}
    setToken(null);
    setPerfilActual(null);
  };

  const valor = {
    token,
    setToken,
    usuario,
    setUsuario,
    perfiles,
    setPerfiles,
    perfilActual,
    setPerfilActual,
    cerrarSesion,
  };
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAutenticacion() {
  return useContext(Contexto);
}
