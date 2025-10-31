// Controlador de contenidos:
// Orquesta llamadas a TMDB (tendencias, videos, búsqueda, detalles)
// y provee lecturas de fuentes locales (JSON de películas/series).
const { obtenerTendencias, obtenerVideos, buscarContenidos, obtenerDetallesSerie, obtenerEpisodiosTemporada, obtenerCreditosTV, obtenerPeliculasPorPagina } = require('../configuracion/tmdb');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
if (ffmpegPath) {
  try { ffmpeg.setFfmpegPath(ffmpegPath); } catch {}
}

async function obtenerPopulares(req, res) {
  try {
    const tipo = req.query.tipo || 'all';
    const periodo = req.query.periodo || 'week';
    const resultados = await obtenerTendencias(tipo, periodo);
    res.json({ resultados });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: 'Error al obtener populares de TMDB' });
  }
}

async function obtenerVideosContenido(req, res) {
  try {
    const { tipo, id } = req.params;
    const datos = await obtenerVideos(tipo, id);
    res.json(datos);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: 'Error al obtener videos del contenido' });
  }
}

module.exports = { obtenerPopulares, obtenerVideosContenido };
 
async function buscar(req, res) {
  try {
    const q = req.query.q || '';
    const tipo = req.query.tipo || 'multi';
    const resultados = await buscarContenidos(q, tipo);
    res.json({ resultados });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: 'Error al buscar en TMDB' });
  }
}

module.exports.buscarContenidos = buscar;

async function obtenerDetallesSerieCtrl(req, res) {
  try {
    const { id } = req.params;
    const datos = await obtenerDetallesSerie(id);
    res.json(datos);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: 'Error al obtener detalles de la serie' });
  }
}

// Nuevo: Películas con paginación y filtros (sin afectar endpoints existentes)
async function obtenerPeliculas(req, res) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const pages = Math.min(parseInt(req.query.pages || '1', 10), 10); // limitar para evitar exceso
    const sort_by = req.query.sort_by || 'popularity.desc';
    const year = req.query.year; // opcional
    const with_genres = req.query.with_genres; // opcional

    const paramsBase = { sort_by, include_adult: false };
    if (year) paramsBase.primary_release_year = year;
    if (with_genres) paramsBase.with_genres = with_genres;

    const tasks = Array.from({ length: pages }, (_, i) => obtenerPeliculasPorPagina(page + i, paramsBase));
    const results = await Promise.all(tasks);
    const planos = results.flat();
    res.json({ resultados: planos, page, pages });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: 'Error al obtener películas paginadas de TMDB' });
  }
}

module.exports.obtenerPeliculas = obtenerPeliculas;

async function obtenerEpisodiosTemporadaCtrl(req, res) {
  try {
    const { id, numero } = req.params;
    const datos = await obtenerEpisodiosTemporada(id, numero);
    res.json(datos);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: 'Error al obtener episodios de la temporada' });
  }
}

async function obtenerCreditosTVCtrl(req, res) {
  try {
    const { id } = req.params;
    const datos = await obtenerCreditosTV(id);
    res.json(datos);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: 'Error al obtener créditos de la serie' });
  }
}

module.exports.obtenerDetallesSerie = obtenerDetallesSerieCtrl;
module.exports.obtenerEpisodiosTemporada = obtenerEpisodiosTemporadaCtrl;
module.exports.obtenerCreditosTV = obtenerCreditosTVCtrl;

// Utilidades
function normalizar(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cargarJSONLocal(nombre) {
  const ruta = path.join(__dirname, '..', 'data', nombre);
  const contenido = fs.readFileSync(ruta, 'utf8');
  return JSON.parse(contenido);
}

async function obtenerFuentePeliculaLocal(req, res) {
  try {
    const { titulo = '', anio } = req.query;
    const datos = cargarJSONLocal('peliculas.json');
    const q = normalizar(titulo);
    let coincidencias = (datos.movies || []).filter(m => normalizar(m.title).includes(q));
    if (anio) {
      coincidencias = coincidencias.filter(m => String(m.year) === String(anio));
    }
    // Preferir fuentes MP4 si existen entre las coincidencias
    const pelicula =
      (coincidencias || []).find(
        (m) =>
          String(m.fileType || '').toLowerCase() === 'mp4' || /\.mp4(\?|$)/i.test(String(m.url || ''))
      ) || coincidencias[0] || null;
    if (!pelicula) return res.status(404).json({ error: 'No se encontró película local' });
    res.json({ url: pelicula.url, titulo: pelicula.title, logo: pelicula.logo, year: pelicula.year });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al buscar película local' });
  }
}

async function obtenerFuenteSerieLocal(req, res) {
  try {
    const { nombre = '', temporada, episodio } = req.query;
    const datos = cargarJSONLocal('series.json');
    const q = normalizar(nombre);
    let lista = (datos.series || []).filter(s => normalizar(s.groupTitle).includes(q));
    if (temporada) {
      lista = lista.filter(s => String(s.season) === String(temporada));
    }
    if (episodio) {
      lista = lista.filter(s => String(s.episode) === String(episodio));
    }
    // Preferir fuentes MP4 si existen entre las coincidencias
    const cap =
      (lista || []).find(
        (s) => String(s.fileType || '').toLowerCase() === 'mp4' || /\.mp4(\?|$)/i.test(String(s.url || ''))
      ) || lista[0] || null;
    if (!cap) return res.status(404).json({ error: 'No se encontró episodio local' });
    res.json({ url: cap.url, titulo: cap.title, logo: cap.logo, temporada: cap.season, episodio: cap.episode });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al buscar serie local' });
  }
}

module.exports.obtenerFuentePeliculaLocal = obtenerFuentePeliculaLocal;
module.exports.obtenerFuenteSerieLocal = obtenerFuenteSerieLocal;

// Transcodificar una fuente MKV remota a MP4 en tiempo real (solo para web)
// GET /contenidos/transcodificar?url=<url_remota>
async function transcodificarFuente(req, res) {
  try {
    const srcUrl = String(req.query.url || '');
    if (!srcUrl) return res.status(400).json({ error: 'URL requerida' });
    const ext = srcUrl.split('?')[0].split('#')[0].split('.').pop().toLowerCase();
    // Solo transcodificar MKV (otras extensiones deben reproducirse directo)
    if (ext !== 'mkv') return res.status(400).json({ error: 'Solo MKV requiere transcodificación' });

    // Normalizar Dropbox para acceso directo
    let url = srcUrl.replace('dl.dropbox.com', 'dl.dropboxusercontent.com');
    if (!/[?&]dl=1/.test(url)) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}dl=1`;
    }

    // Obtener stream de origen
    const respuesta = await axios.get(url, { responseType: 'stream' });
    const origenStream = respuesta.data;

    // Encabezados para streaming MP4 fragmentado
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');

    // Configurar ffmpeg: transcodificación rápida y salida fragmentada para reproducir mientras descarga
    const comando = ffmpeg(origenStream)
      .videoCodec('libx264')
      .audioCodec('aac')
      .format('mp4')
      .outputOptions([
        '-preset veryfast',
        '-movflags frag_keyframe+empty_moov',
        '-profile:v baseline',
        '-level 3.0',
      ])
      .on('error', (err) => {
        console.error('Error ffmpeg:', err?.message || err);
        if (!res.headersSent) res.status(500).json({ error: 'Error al transcodificar fuente' });
        try { res.end(); } catch {}
      })
      .on('end', () => {
        try { res.end(); } catch {}
      });

    // Enviar salida al cliente
    comando.pipe(res, { end: true });
  } catch (e) {
    console.error('Error transcodificarFuente:', e?.message || e);
    if (!res.headersSent) res.status(500).json({ error: 'Error al procesar la fuente' });
  }
}

module.exports.transcodificarFuente = transcodificarFuente;
