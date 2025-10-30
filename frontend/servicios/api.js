// Cliente API del frontend:
// Expone funciones para consumir el backend (contenidos, perfiles, auth, listas).
import CONFIGURACION from '../configuracion';

export async function obtenerPopulares({ tipo = 'all', periodo = 'week' } = {}) {
  const url = `${CONFIGURACION.BASE_URL}/contenidos/populares?tipo=${tipo}&periodo=${periodo}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Error al obtener populares');
  const json = await resp.json();
  return json.resultados || [];
}

export async function obtenerVideosContenido(tipo, id) {
  const url = `${CONFIGURACION.BASE_URL}/contenidos/${tipo}/${id}/videos`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Error al obtener videos');
  return resp.json();
}

export async function buscarContenidos({ q, tipo = 'multi' }) {
  const url = `${CONFIGURACION.BASE_URL}/contenidos/buscar?q=${encodeURIComponent(q)}&tipo=${tipo}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Error al buscar contenidos');
  const json = await resp.json();
  return json.resultados || [];
}

// Series (TV)
export async function obtenerDetallesSerie(id) {
  const url = `${CONFIGURACION.BASE_URL}/contenidos/tv/${id}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Error al obtener detalles de la serie');
  return resp.json();
}

export async function obtenerEpisodiosTemporada(id, numero) {
  const url = `${CONFIGURACION.BASE_URL}/contenidos/tv/${id}/temporada/${numero}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Error al obtener episodios');
  return resp.json();
}

export async function obtenerCreditosTV(id) {
  const url = `${CONFIGURACION.BASE_URL}/contenidos/tv/${id}/creditos`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Error al obtener créditos');
  return resp.json();
}

// Fuentes locales (películas y series desde JSON)
export async function obtenerFuentePeliculaLocal({ titulo, anio }) {
  const params = new URLSearchParams();
  if (titulo) params.set('titulo', titulo);
  if (anio) params.set('anio', anio);
  const url = `${CONFIGURACION.BASE_URL}/contenidos/local/pelicula?${params.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('No se encontró la película local');
  return resp.json();
}

export async function obtenerFuenteSerieLocal({ nombre, temporada, episodio }) {
  const params = new URLSearchParams();
  if (nombre) params.set('nombre', nombre);
  if (temporada) params.set('temporada', temporada);
  if (episodio) params.set('episodio', episodio);
  const url = `${CONFIGURACION.BASE_URL}/contenidos/local/serie?${params.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('No se encontró el episodio local');
  return resp.json();
}

export async function registrarUsuario({ nombre, correo, clave }) {
  const url = `${CONFIGURACION.BASE_URL}/autenticacion/registro`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, clave }), // nombre no usado por backend actualmente
  });
  if (!resp.ok) throw new Error('Error al registrar');
  return resp.json();
}

export async function ingresarUsuario({ correo, clave }) {
  const url = `${CONFIGURACION.BASE_URL}/autenticacion/ingreso`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, clave }),
  });
  if (!resp.ok) {
    const msg = await resp.text().catch(() => '');
    throw new Error(msg || 'Error al ingresar');
  }
  return resp.json();
}

// Passwordless: solicitar código e ingresar con código
export async function solicitarCodigoLogin({ correo }) {
  const url = `${CONFIGURACION.BASE_URL}/autenticacion/codigo/solicitar`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo }),
  });
  if (!resp.ok) throw new Error('Error al solicitar código');
  return resp.json(); // { ok, codigo }
}

export async function ingresarConCodigo({ correo, codigo }) {
  const url = `${CONFIGURACION.BASE_URL}/autenticacion/codigo/ingresar`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, codigo }),
  });
  if (!resp.ok) throw new Error('Código inválido o expirado');
  return resp.json(); // { token }
}

// Recuperación de contraseña
export async function solicitarResetClave({ correo }) {
  const url = `${CONFIGURACION.BASE_URL}/autenticacion/clave/solicitar-reset`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo }),
  });
  if (!resp.ok) throw new Error('Error al solicitar restablecimiento');
  return resp.json(); // { ok, token }
}

export async function restablecerClave({ token, nueva_clave }) {
  const url = `${CONFIGURACION.BASE_URL}/autenticacion/clave/restablecer`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, nueva_clave }),
  });
  if (!resp.ok) throw new Error('No se pudo restablecer la contraseña');
  return resp.json();
}

export async function listarPerfiles(token) {
  const url = `${CONFIGURACION.BASE_URL}/perfiles`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) throw new Error('Error al listar perfiles');
  const json = await resp.json();
  return json.perfiles || [];
}

export async function crearPerfil(token, { nombre, avatar }) {
  const url = `${CONFIGURACION.BASE_URL}/perfiles`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ nombre, avatar }),
  });
  if (!resp.ok) throw new Error('Error al crear perfil');
  return resp.json();
}

export async function actualizarPerfil(token, id, { nombre, avatar }) {
  const url = `${CONFIGURACION.BASE_URL}/perfiles/${id}`;
  const resp = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ nombre, avatar }),
  });
  if (!resp.ok) throw new Error('Error al actualizar perfil');
  return resp.json();
}

export async function eliminarPerfil(token, id) {
  const url = `${CONFIGURACION.BASE_URL}/perfiles/${id}`;
  const resp = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) throw new Error('Error al eliminar perfil');
  return resp.json();
}

// Funciones para Mi Lista
export async function obtenerMiLista(token, perfilId) {
  const url = `${CONFIGURACION.BASE_URL}/mi-lista/${perfilId}`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) throw new Error('Error al obtener Mi Lista');
  const json = await resp.json();
  return json.miLista || [];
}

export async function agregarAMiLista(token, perfilId, { tipo, contenido_id, titulo, poster }) {
  const url = `${CONFIGURACION.BASE_URL}/mi-lista/${perfilId}/agregar`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ tipo, contenido_id, titulo, poster }),
  });
  if (!resp.ok) throw new Error('Error al agregar a Mi Lista');
  return resp.json();
}

export async function quitarDeMiLista(token, perfilId, { tipo, contenido_id }) {
  const url = `${CONFIGURACION.BASE_URL}/mi-lista/${perfilId}/quitar`;
  const resp = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ tipo, contenido_id }),
  });
  if (!resp.ok) throw new Error('Error al quitar de Mi Lista');
  return resp.json();
}

export async function verificarEnMiLista(token, perfilId, { tipo, contenido_id }) {
  const url = `${CONFIGURACION.BASE_URL}/mi-lista/${perfilId}/verificar?tipo=${tipo}&contenido_id=${contenido_id}`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) throw new Error('Error al verificar Mi Lista');
  const json = await resp.json();
  return json.enMiLista || false;
}

// Calificaciones
export async function guardarCalificacion(token, { perfil_id, contenido_id, tipo, estrellas }) {
  const url = `${CONFIGURACION.BASE_URL}/calificaciones`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ perfil_id, contenido_id, tipo, estrellas })
  });
  if (!resp.ok) {
    // intentar leer mensaje del servidor
    try {
      const json = await resp.json();
      const msg = json && (json.error || json.message || JSON.stringify(json));
      throw new Error(msg || 'Error al guardar calificación');
    } catch (e) {
      const text = await resp.text().catch(() => '');
      throw new Error(text || 'Error al guardar calificación');
    }
  }
  return resp.json();
}

export async function obtenerCalificaciones(token, perfil_id) {
  const url = `${CONFIGURACION.BASE_URL}/calificaciones/${perfil_id}`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) throw new Error('Error al obtener calificaciones');
  return resp.json();
}

export async function eliminarCalificacion(token, { perfil_id, contenido_id, tipo }) {
  const url = `${CONFIGURACION.BASE_URL}/calificaciones`;
  const resp = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ perfil_id, contenido_id, tipo })
  });
  if (!resp.ok) {
    try {
      const json = await resp.json();
      throw new Error(json && (json.error || JSON.stringify(json)) || 'Error al eliminar calificación');
    } catch (e) {
      const text = await resp.text().catch(() => '');
      throw new Error(text || 'Error al eliminar calificación');
    }
  }
  return resp.json();
}