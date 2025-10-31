// Contexto de Autenticación
// Provee estado global: token, usuario, perfiles y perfil activo
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Crea un contexto con valor inicial nulo
const Contexto = createContext(null);

// Proveedor que envuelve la app y expone el estado de autenticación
export function ProveedorAutenticacion({ children }) {
  const [token, setToken] = useState(null); // JWT del usuario
  const [usuario, setUsuario] = useState(null); // Datos del usuario (futuro)
  const [perfiles, setPerfiles] = useState([]); // Perfiles disponibles
  const [perfilActual, setPerfilActual] = useState(null); // Perfil elegido

  // Cargar sesión almacenada al iniciar
  // Cargar sesión almacenada al iniciar (token y perfil activo)
  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('auth.token');
        const p = await AsyncStorage.getItem('auth.perfilActual');
        if (t) setToken(t);
        if (p) setPerfilActual(JSON.parse(p));
      } catch (e) {
        // Ignora errores de almacenamiento
      }
    })();
  }, []);

  // Persistir cambios de sesión
  // Persistir cambios de token (guardar o limpiar)
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

  // Persistir el perfil actual (guardar o limpiar)
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

  // Cierra sesión y limpia almacenamiento
  const cerrarSesion = async () => {
    try {
      await AsyncStorage.removeItem('auth.token');
      await AsyncStorage.removeItem('auth.perfilActual');
    } catch (_) {}
    setToken(null);
    setPerfilActual(null);
  };

  // Valor expuesto por el contexto
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
  // Envuelve y provee el contexto a los hijos
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

// Hook para consumir el contexto de autenticación
export function useAutenticacion() {
  return useContext(Contexto);
}
