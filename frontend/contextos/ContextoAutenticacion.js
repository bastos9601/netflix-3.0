import React, { createContext, useContext, useState } from 'react';

const Contexto = createContext(null);

export function ProveedorAutenticacion({ children }) {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [perfiles, setPerfiles] = useState([]);
  const [perfilActual, setPerfilActual] = useState(null);

  const cerrarSesion = () => setToken(null);

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