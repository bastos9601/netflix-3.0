const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

const clienteTMDB = axios.create({ baseURL: BASE_URL, params: { api_key: API_KEY, language: 'es-ES' } });

async function obtenerTendencias(tipo = 'all', periodo = 'week') {
  const { data } = await clienteTMDB.get(`/trending/${tipo}/${periodo}`);
  return (data.results || []).map((item) => ({
    id: item.id,
    titulo: item.title || item.name,
    tipo: item.media_type || tipo,
    poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
    fondo: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : null,
    resumen: item.overview,
    fecha: item.release_date || item.first_air_date,
  }));
}

async function obtenerVideos(tipo, id) {
  const { data } = await clienteTMDB.get(`/${tipo}/${id}/videos`);
  const todos = data.results || [];
  // Preferir trailers/teasers. Priorizar Vimeo si existe, luego YouTube.
  const candidatos = todos.filter(v => (v.type === 'Trailer' || v.type === 'Teaser'));
  const vimeo = candidatos.find(v => v.site === 'Vimeo');
  const youtube = candidatos.find(v => v.site === 'YouTube');
  const principal = vimeo || youtube || candidatos[0] || todos[0] || null;
  return { videos: todos, trailer_principal: principal };
}

async function buscarContenidos(q, tipo = 'multi') {
  if (!q || String(q).trim() === '') return [];
  let endpoint = '/search/multi';
  if (tipo === 'movie') endpoint = '/search/movie';
  if (tipo === 'tv') endpoint = '/search/tv';
  const { data } = await clienteTMDB.get(endpoint, { params: { query: q } });
  return (data.results || [])
    .filter((item) => item.media_type === 'movie' || item.media_type === 'tv' || tipo !== 'multi')
    .map((item) => ({
      id: item.id,
      titulo: item.title || item.name,
      tipo: item.media_type || tipo,
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      fondo: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : null,
      resumen: item.overview,
      fecha: item.release_date || item.first_air_date,
    }));
}

async function obtenerDetallesSerie(id) {
  const { data } = await clienteTMDB.get(`/tv/${id}`);
  return {
    id: data.id,
    titulo: data.name,
    tipo: 'tv',
    poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
    fondo: data.backdrop_path ? `https://image.tmdb.org/t/p/w780${data.backdrop_path}` : null,
    resumen: data.overview,
    fecha: data.first_air_date,
    temporadas: data.seasons || [],
    total_temporadas: data.number_of_seasons,
    total_episodios: data.number_of_episodes,
    generos: (data.genres || []).map(g => g.name),
    adulto: !!data.adult,
    puntuacion: data.vote_average,
  };
}

async function obtenerEpisodiosTemporada(id, numeroTemporada) {
  const { data } = await clienteTMDB.get(`/tv/${id}/season/${numeroTemporada}`);
  return {
    id: data.id,
    temporada: data.season_number,
    nombre: data.name,
    episodios: (data.episodes || []).map(ep => ({
      id: ep.id,
      numero: ep.episode_number,
      titulo: ep.name,
      resumen: ep.overview,
      imagen: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : null,
      duracion: ep.runtime,
      fecha: ep.air_date,
    })),
  };
}

async function obtenerCreditosTV(id) {
  const { data } = await clienteTMDB.get(`/tv/${id}/credits`);
  return {
    reparto: (data.cast || []).map(c => ({ id: c.id, nombre: c.name, personaje: c.character, foto: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null })).slice(0, 20),
    equipo: (data.crew || []).map(c => ({ id: c.id, nombre: c.name, trabajo: c.job, departamento: c.department })).slice(0, 20),
  };
}

module.exports = { clienteTMDB, obtenerTendencias, obtenerVideos, buscarContenidos, obtenerDetallesSerie, obtenerEpisodiosTemporada, obtenerCreditosTV };