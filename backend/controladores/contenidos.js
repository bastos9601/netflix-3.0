const { obtenerTendencias, obtenerVideos, buscarContenidos, obtenerDetallesSerie, obtenerEpisodiosTemporada, obtenerCreditosTV } = require('../configuracion/tmdb');
const fs = require('fs');
const path = require('path');

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
    const pelicula = coincidencias[0] || null;
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
    const cap = lista[0] || null;
    if (!cap) return res.status(404).json({ error: 'No se encontró episodio local' });
    res.json({ url: cap.url, titulo: cap.title, logo: cap.logo, temporada: cap.season, episodio: cap.episode });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al buscar serie local' });
  }
}

module.exports.obtenerFuentePeliculaLocal = obtenerFuentePeliculaLocal;
module.exports.obtenerFuenteSerieLocal = obtenerFuenteSerieLocal;