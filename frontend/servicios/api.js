// Cliente API del frontend
// Expone funciones para consumir el backend (contenidos, perfiles, auth, listas)
import CONFIGURACION from '../configuracion';

// Obtiene lista de contenidos populares desde el backend
export async function obtenerPopulares({ tipo = 'all', periodo = 'week' } = {}) {
  const url = `${CONFIGURACION.BASE_URL}/contenidos/populares?tipo=${tipo}&periodo=${periodo}`; // Construye URL con parámetros
  const resp = await fetch(url); // Realiza petición HTTP
  if (!resp.ok) throw new Error('Error al obtener populares'); // Maneja errores de red/servidor
  const json = await resp.json(); // Parseo de respuesta JSON
  return json.resultados || []; // Devuelve lista o vacío
}

// Nuevo: obtener películas (TMDB discover) con paginación agregada
// Obtiene películas con filtros/paginación desde el backend (TMDB)
export async function obtenerPeliculas({ page = 1, pages = 1, sort_by = 'popularity.desc', year, with_genres } = {}) {
  const params = new URLSearchParams({ page: String(page), pages: String(pages), sort_by }); // Construye query params
  if (year) params.append('year', String(year)); // Agrega año si corresponde
  if (with_genres) params.append('with_genres', String(with_genres)); // Filtra por géneros
  const url = `${CONFIGURACION.BASE_URL}/contenidos/peliculas?${params.toString()}`; // Endpoint del backend
  const resp = await fetch(url); // Petición HTTP
  if (!resp.ok) throw new Error('Error al obtener películas'); // Error si status no OK
  const json = await resp.json(); // Parseo JSON
  return json.resultados || []; // Lista de resultados
}

// Obtiene videos asociados a un contenido (tráilers y clips) desde TMDB vía backend
export async function obtenerVideosContenido(tipo, id) {
  const url = `${CONFIGURACION.BASE_URL}/contenidos/${tipo}/${id}/videos`; // URL específica por tipo y id
  const resp = await fetch(url); // Petición HTTP
  if (!resp.ok) throw new Error('Error al obtener videos'); // Manejo de error
  return resp.json(); // Resultado JSON con lista de videos
}

// Busca contenidos por texto y tipo usando el backend (TMDB search)
export async function buscarContenidos({ q, tipo = 'multi' }) {
  const url = `${CONFIGURACION.BASE_URL}/contenidos/buscar?q=${encodeURIComponent(q)}&tipo=${tipo}`; // Construye URL con query
  const resp = await fetch(url); // Petición HTTP
  if (!resp.ok) throw new Error('Error al buscar contenidos'); // Error si no OK
  const json = await resp.json(); // Parseo JSON
  return json.resultados || []; // Lista de resultados
}

// Series (TV)
// Obtiene detalles de una serie de TV
export async function obtenerDetallesSerie(id) {
  const url = `${CONFIGURACION.BASE_URL}/contenidos/tv/${id}`; // Endpoint de detalles
  const resp = await fetch(url); // Petición
  if (!resp.ok) throw new Error('Error al obtener detalles de la serie'); // Manejo de error
  return resp.json(); // Detalles de la serie
}

// Obtiene los episodios de una temporada específica
export async function obtenerEpisodiosTemporada(id, numero) {
  const url = `${CONFIGURACION.BASE_URL}/contenidos/tv/${id}/temporada/${numero}`; // Endpoint por temporada
  const resp = await fetch(url); // Petición
  if (!resp.ok) throw new Error('Error al obtener episodios'); // Manejo de error
  return resp.json(); // Lista de episodios
}

// Obtiene créditos de reparto/equipo de una serie
export async function obtenerCreditosTV(id) {
  const url = `${CONFIGURACION.BASE_URL}/contenidos/tv/${id}/creditos`; // Endpoint de créditos
  const resp = await fetch(url); // Petición
  if (!resp.ok) throw new Error('Error al obtener créditos'); // Manejo de error
  return resp.json(); // Datos de créditos
}

// Fuentes locales (películas y series desde JSON)
// Obtiene una fuente de película desde JSON local del backend
export async function obtenerFuentePeliculaLocal({ titulo, anio }) {
  const params = new URLSearchParams(); // Construye query
  if (titulo) params.set('titulo', titulo); // Filtra por título
  if (anio) params.set('anio', anio); // Filtra por año
  const url = `${CONFIGURACION.BASE_URL}/contenidos/local/pelicula?${params.toString()}`; // Endpoint
  const resp = await fetch(url); // Petición
  if (!resp.ok) throw new Error('No se encontró la película local'); // Manejo de error
  return resp.json(); // Fuente local
}

// Obtiene una fuente de serie/episodio desde JSON local del backend
export async function obtenerFuenteSerieLocal({ nombre, temporada, episodio }) {
  const params = new URLSearchParams(); // Construye query
  if (nombre) params.set('nombre', nombre); // Filtra por nombre
  if (temporada) params.set('temporada', temporada); // Selecciona temporada
  if (episodio) params.set('episodio', episodio); // Selecciona episodio
  const url = `${CONFIGURACION.BASE_URL}/contenidos/local/serie?${params.toString()}`; // Endpoint
  const resp = await fetch(url); // Petición
  if (!resp.ok) throw new Error('No se encontró el episodio local'); // Manejo de error
  return resp.json(); // Fuente local
}

// Registra un nuevo usuario en el backend
export async function registrarUsuario({ nombre, correo, clave }) {
  const url = `${CONFIGURACION.BASE_URL}/autenticacion/registro`; // Endpoint de registro
  const resp = await fetch(url, {
    method: 'POST', // Método HTTP
    headers: { 'Content-Type': 'application/json' }, // JSON en el cuerpo
    body: JSON.stringify({ correo, clave }), // nombre no usado por backend actualmente
  });
  if (!resp.ok) throw new Error('Error al registrar'); // Manejo de error
  return resp.json(); // Respuesta con token/usuario
}

// Inicia sesión con correo y clave
export async function ingresarUsuario({ correo, clave }) {
  const url = `${CONFIGURACION.BASE_URL}/autenticacion/ingreso`; // Endpoint de login
  const resp = await fetch(url, {
    method: 'POST', // Método HTTP
    headers: { 'Content-Type': 'application/json' }, // JSON
    body: JSON.stringify({ correo, clave }), // Credenciales
  });
  if (!resp.ok) {
    const msg = await resp.text().catch(() => ''); // Intenta leer mensaje
    throw new Error(msg || 'Error al ingresar'); // Lanza error con mensaje
  }
  return resp.json(); // Devuelve token/datos
}

// Passwordless: solicitar código e ingresar con código
// Solicita un código de acceso (passwordless) al correo
export async function solicitarCodigoLogin({ correo }) {
  const url = `${CONFIGURACION.BASE_URL}/autenticacion/codigo/solicitar`; // Endpoint
  const resp = await fetch(url, {
    method: 'POST', // Método HTTP
    headers: { 'Content-Type': 'application/json' }, // Tipo de contenido
    body: JSON.stringify({ correo }), // Correo destino
  });
  if (!resp.ok) throw new Error('Error al solicitar código'); // Manejo de error
  return resp.json(); // { ok, codigo }
}

// Inicia sesión usando un código de acceso enviado por correo
export async function ingresarConCodigo({ correo, codigo }) {
  const url = `${CONFIGURACION.BASE_URL}/autenticacion/codigo/ingresar`; // Endpoint
  const resp = await fetch(url, {
    method: 'POST', // Método HTTP
    headers: { 'Content-Type': 'application/json' }, // Tipo de contenido
    body: JSON.stringify({ correo, codigo }), // Datos
  });
  if (!resp.ok) throw new Error('Código inválido o expirado'); // Manejo de error
  return resp.json(); // { token }
}

// Recuperación de contraseña
// Solicita un token para restablecer la contraseña
export async function solicitarResetClave({ correo }) {
  const url = `${CONFIGURACION.BASE_URL}/autenticacion/clave/solicitar-reset`; // Endpoint
  const resp = await fetch(url, {
    method: 'POST', // Método HTTP
    headers: { 'Content-Type': 'application/json' }, // Tipo de contenido
    body: JSON.stringify({ correo }), // Correo del usuario
  });
  if (!resp.ok) throw new Error('Error al solicitar restablecimiento'); // Manejo de error
  return resp.json(); // { ok, token }
}

// Restablece la contraseña usando el token de recuperación
export async function restablecerClave({ token, nueva_clave }) {
  const url = `${CONFIGURACION.BASE_URL}/autenticacion/clave/restablecer`; // Endpoint
  const resp = await fetch(url, {
    method: 'POST', // Método HTTP
    headers: { 'Content-Type': 'application/json' }, // Tipo de contenido
    body: JSON.stringify({ token, nueva_clave }), // Datos
  });
  if (!resp.ok) throw new Error('No se pudo restablecer la contraseña'); // Manejo de error
  return resp.json(); // Resultado
}

// Lista los perfiles asociados al usuario autenticado
export async function listarPerfiles(token) {
  const url = `${CONFIGURACION.BASE_URL}/perfiles`; // Endpoint
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }); // Incluye JWT
  if (!resp.ok) throw new Error('Error al listar perfiles'); // Manejo de error
  const json = await resp.json(); // Parseo JSON
  return json.perfiles || []; // Devuelve lista
}

// Crea un nuevo perfil para el usuario
export async function crearPerfil(token, { nombre, avatar }) {
  const url = `${CONFIGURACION.BASE_URL}/perfiles`; // Endpoint
  const resp = await fetch(url, {
    method: 'POST', // Método HTTP
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, // JWT
    body: JSON.stringify({ nombre, avatar }), // Datos del perfil
  });
  if (!resp.ok) throw new Error('Error al crear perfil'); // Manejo de error
  return resp.json(); // Perfil creado
}

// Actualiza los datos de un perfil existente
export async function actualizarPerfil(token, id, { nombre, avatar }) {
  const url = `${CONFIGURACION.BASE_URL}/perfiles/${id}`; // Endpoint con id
  const resp = await fetch(url, {
    method: 'PUT', // Método HTTP
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, // JWT
    body: JSON.stringify({ nombre, avatar }), // Nuevos datos
  });
  if (!resp.ok) throw new Error('Error al actualizar perfil'); // Manejo de error
  return resp.json(); // Perfil actualizado
}

// Elimina un perfil por id
export async function eliminarPerfil(token, id) {
  const url = `${CONFIGURACION.BASE_URL}/perfiles/${id}`; // Endpoint con id
  const resp = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); // Método DELETE
  if (!resp.ok) throw new Error('Error al eliminar perfil'); // Manejo de error
  return resp.json(); // Resultado
}

// Funciones para Mi Lista
// Obtiene la lista de contenidos guardados (Mi Lista) para un perfil
export async function obtenerMiLista(token, perfilId) {
  const url = `${CONFIGURACION.BASE_URL}/mi-lista/${perfilId}`; // Endpoint con perfil
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }); // JWT
  if (!resp.ok) throw new Error('Error al obtener Mi Lista'); // Manejo de error
  const json = await resp.json(); // Parseo JSON
  return json.miLista || []; // Lista
}

// Agrega un contenido a “Mi Lista” de un perfil
export async function agregarAMiLista(token, perfilId, { tipo, contenido_id, titulo, poster }) {
  const url = `${CONFIGURACION.BASE_URL}/mi-lista/${perfilId}/agregar`; // Endpoint
  const resp = await fetch(url, {
    method: 'POST', // Método HTTP
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, // JWT
    body: JSON.stringify({ tipo, contenido_id, titulo, poster }), // Datos del contenido
  });
  if (!resp.ok) throw new Error('Error al agregar a Mi Lista'); // Manejo de error
  return resp.json(); // Resultado
}

// Quita un contenido de “Mi Lista” de un perfil
export async function quitarDeMiLista(token, perfilId, { tipo, contenido_id }) {
  const url = `${CONFIGURACION.BASE_URL}/mi-lista/${perfilId}/quitar`; // Endpoint
  const resp = await fetch(url, {
    method: 'DELETE', // Método HTTP
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, // JWT
    body: JSON.stringify({ tipo, contenido_id }), // Datos del contenido
  });
  if (!resp.ok) throw new Error('Error al quitar de Mi Lista'); // Manejo de error
  return resp.json(); // Resultado
}

// Verifica si un contenido está en “Mi Lista” para un perfil
export async function verificarEnMiLista(token, perfilId, { tipo, contenido_id }) {
  const url = `${CONFIGURACION.BASE_URL}/mi-lista/${perfilId}/verificar?tipo=${tipo}&contenido_id=${contenido_id}`; // Endpoint con query
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }); // JWT
  if (!resp.ok) throw new Error('Error al verificar Mi Lista'); // Manejo de error
  const json = await resp.json(); // Parseo JSON
  return json.enMiLista || false; // Booleano
}

// Calificaciones
// Guarda una calificación (0-5 estrellas) para un contenido y perfil
export async function guardarCalificacion(token, { perfil_id, contenido_id, tipo, estrellas }) {
  const url = `${CONFIGURACION.BASE_URL}/calificaciones`; // Endpoint
  const resp = await fetch(url, {
    method: 'POST', // Método HTTP
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, // JWT
    body: JSON.stringify({ perfil_id, contenido_id, tipo, estrellas }) // Datos
  });
  if (!resp.ok) {
    // Intenta leer mensaje del servidor en JSON
    try {
      const json = await resp.json();
      const msg = json && (json.error || json.message || JSON.stringify(json));
      throw new Error(msg || 'Error al guardar calificación');
    } catch (e) {
      // Si no hay JSON, intenta leer texto plano
      const text = await resp.text().catch(() => '');
      throw new Error(text || 'Error al guardar calificación');
    }
  }
  return resp.json(); // Resultado
}

// Obtiene las calificaciones guardadas para un perfil
export async function obtenerCalificaciones(token, perfil_id) {
  const url = `${CONFIGURACION.BASE_URL}/calificaciones/${perfil_id}`; // Endpoint con perfil
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }); // JWT
  if (!resp.ok) throw new Error('Error al obtener calificaciones'); // Manejo de error
  return resp.json(); // Lista de calificaciones
}

// Elimina una calificación para un perfil y contenido
export async function eliminarCalificacion(token, { perfil_id, contenido_id, tipo }) {
  const url = `${CONFIGURACION.BASE_URL}/calificaciones`; // Endpoint
  const resp = await fetch(url, {
    method: 'DELETE', // Método HTTP
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, // JWT
    body: JSON.stringify({ perfil_id, contenido_id, tipo }) // Datos
  });
  if (!resp.ok) {
    // Intenta leer mensaje del servidor
    try {
      const json = await resp.json();
      throw new Error(json && (json.error || JSON.stringify(json)) || 'Error al eliminar calificación');
    } catch (e) {
      const text = await resp.text().catch(() => '');
      throw new Error(text || 'Error al eliminar calificación');
    }
  }
  return resp.json(); // Resultado
}
