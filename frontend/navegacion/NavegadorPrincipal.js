// Navegador principal: controla el flujo de pantallas y el root con tabs inferiores
// Importa React y hooks para gestionar estado y efectos
import React, { useEffect, useState } from 'react';
// Importa el contexto de autenticación para conocer token y perfil
import { useAutenticacion } from '../contextos/ContextoAutenticacion';
// Importa pantallas de tabs
import Inicio from '../pantallas/inicio';
import Juegos from '../pantallas/Juegos';
import NuevosPopulares from '../pantallas/NuevosPopulares';
import MiNetflix from '../pantallas/MiNetflix';
// Importa componentes comunes de navegación/búsqueda
import BarraTabs from '../componentes/BarraTabs';
import BuscadorGlobal from '../componentes/BuscadorGlobal';
// Importa pantalla de detalle que se muestra como overlay global
import DetalleContenido from '../pantallas/DetalleContenido';
// Importa pantallas del flujo de onboarding/autenticación
import Arranque from '../pantallas/Arranque';
import Presentacion from '../pantallas/Presentacion';
import InicioSesion from '../pantallas/InicioSesion';
import Registro from '../pantallas/Registro';
import Perfiles from '../pantallas/Perfiles';

// Navegador mínimo: muestra pantalla de arranque animada y luego Inicio.
// Componente del navegador principal
export default function NavegadorPrincipal() {
  // Fase actual del flujo (arranque -> presentacion -> registro/inicio_sesion -> perfiles -> inicio)
  const [fase, setFase] = useState('arranque');
  // Extrae token y perfil actual del contexto de autenticación
  const { token, perfilActual } = useAutenticacion();

  // Tras el arranque, decidir fase según sesión restaurada
  // Tras el arranque, decide a qué fase pasar según si hay sesión y perfil
  useEffect(() => {
    const t = setTimeout(() => {
      if (token) {
        // Si hay token, pasa a inicio si hay perfil, o a selección de perfiles
        setFase(perfilActual ? 'inicio' : 'perfiles');
      } else {
        // Sin token, muestra la pantalla de presentación
        setFase('presentacion');
      }
    }, 1800); // Pequeña espera para mostrar animación de arranque
    // Limpia el temporizador al desmontar o cambiar dependencias
    return () => clearTimeout(t);
  }, [token, perfilActual]);

  // Cuando el token cambia en caliente, reubicar fase según perfil
  // Cuando cambian token/perfil en caliente (sin arranque), reubica la fase
  useEffect(() => {
    if (fase === 'arranque') return; // Evita interferir con la animación inicial
    if (token) {
      setFase(perfilActual ? 'inicio' : 'perfiles');
    } else {
      setFase('presentacion');
    }
  }, [token, perfilActual]);

  // Renderiza pantallas según la fase actual del flujo
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

// Componente de tabs inferior que cambia entre secciones principales
function TabsRoot() {
  // Tab activo: 'inicio' | 'juegos' | 'nuevos' | 'mi'
  const [tab, setTab] = useState('inicio');
  // Controla visibilidad del modal de búsqueda global
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  // Elemento seleccionado desde el buscador para mostrar su detalle
  const [detalleGlobal, setDetalleGlobal] = useState(null);
  return (
    <>
      {/* Renderiza la pantalla correspondiente al tab activo */}
      {tab === 'inicio' && <Inicio onOpenBuscar={() => setMostrarBuscador(true)} />}
      {tab === 'juegos' && <Juegos onOpenBuscar={() => setMostrarBuscador(true)} />}
      {tab === 'nuevos' && <NuevosPopulares onOpenBuscar={() => setMostrarBuscador(true)} />}
      {tab === 'mi' && <MiNetflix onOpenBuscar={() => setMostrarBuscador(true)} />}
      {/* Barra de tabs inferior que permite cambiar de sección */}
      <BarraTabs activo={tab} onCambiar={setTab} />
      {/* Modal de búsqueda global */}
      <BuscadorGlobal
        visible={mostrarBuscador}
        onClose={() => setMostrarBuscador(false)}
        onSelectItem={(item) => setDetalleGlobal(item)}
      />
      {/* Si hay un elemento seleccionado, muestra el detalle como overlay */}
      {!!detalleGlobal && (
        <DetalleContenido item={detalleGlobal} onCerrar={() => setDetalleGlobal(null)} />
      )}
    </>
  );
}
