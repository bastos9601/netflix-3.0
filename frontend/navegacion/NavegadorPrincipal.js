// Navegador principal:
// Controla el flujo de pantallas (arranque, presentación, login, registro, perfiles)
// y el root con tabs inferiores.
import React, { useEffect, useState } from 'react';
import { useAutenticacion } from '../contextos/ContextoAutenticacion';
import Inicio from '../pantallas/inicio';
import Juegos from '../pantallas/Juegos';
import NuevosPopulares from '../pantallas/NuevosPopulares';
import MiNetflix from '../pantallas/MiNetflix';
import BarraTabs from '../componentes/BarraTabs';
import BuscadorGlobal from '../componentes/BuscadorGlobal';
import DetalleContenido from '../pantallas/DetalleContenido';
import Arranque from '../pantallas/Arranque';
import Presentacion from '../pantallas/Presentacion';
import InicioSesion from '../pantallas/InicioSesion';
import Registro from '../pantallas/Registro';
import Perfiles from '../pantallas/Perfiles';

// Navegador mínimo: muestra pantalla de arranque animada y luego Inicio.
export default function NavegadorPrincipal() {
  const [fase, setFase] = useState('arranque'); // arranque -> presentacion -> registro -> inicio
  const { token } = useAutenticacion();

  useEffect(() => {
    const t = setTimeout(() => setFase('presentacion'), 1800);
    return () => clearTimeout(t);
  }, []);

  // Si el usuario cierra sesión (token null), volver a pantalla de inicio de sesión
  useEffect(() => {
    if (fase !== 'arranque' && !token) {
      setFase('inicio_sesion');
    }
  }, [token]);

  if (fase === 'arranque') return <Arranque />;
  if (fase === 'presentacion') return (
    <Presentacion
      onComienzaYa={() => setFase('registro')}
      onIniciarSesion={() => setFase('inicio_sesion')}
    />
  );
  if (fase === 'inicio_sesion') return <InicioSesion onExito={() => setFase('perfiles')} onCancelar={() => setFase('presentacion')} />;
  if (fase === 'registro') return <Registro onCancel={() => setFase('presentacion')} onExito={() => setFase('perfiles')} />;
  if (fase === 'perfiles') return <Perfiles onElegir={() => setFase('inicio')} />;

  // Root con tabs inferiores
  return <TabsRoot />;
}

function TabsRoot() {
  const [tab, setTab] = useState('inicio');
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [detalleGlobal, setDetalleGlobal] = useState(null);
  return (
    <>
      {tab === 'inicio' && <Inicio onOpenBuscar={() => setMostrarBuscador(true)} />}
      {tab === 'juegos' && <Juegos onOpenBuscar={() => setMostrarBuscador(true)} />}
      {tab === 'nuevos' && <NuevosPopulares onOpenBuscar={() => setMostrarBuscador(true)} />}
      {tab === 'mi' && <MiNetflix onOpenBuscar={() => setMostrarBuscador(true)} />}
      <BarraTabs activo={tab} onCambiar={setTab} />
      <BuscadorGlobal
        visible={mostrarBuscador}
        onClose={() => setMostrarBuscador(false)}
        onSelectItem={(item) => setDetalleGlobal(item)}
      />
      {!!detalleGlobal && (
        <DetalleContenido item={detalleGlobal} onCerrar={() => setDetalleGlobal(null)} />
      )}
    </>
  );
}