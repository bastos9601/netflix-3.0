// Controlador para calificaciones
const pool = require('../configuracion_bd');

// Guardar o actualizar calificación
async function guardarCalificacion(req, res) {
  try {
    const { perfil_id, contenido_id, tipo, estrellas } = req.body;
    if (!perfil_id || !contenido_id || !tipo || estrellas == null) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    // Si ya existe, actualiza; si no, inserta
    const [existe] = await pool.query(
      'SELECT id FROM calificaciones WHERE perfil_id = ? AND contenido_id = ? AND tipo = ?',
      [perfil_id, contenido_id, tipo]
    );
    if (existe.length > 0) {
      await pool.query(
        'UPDATE calificaciones SET estrellas = ?, fecha = NOW() WHERE id = ?',
        [estrellas, existe[0].id]
      );
      return res.json({ ok: true, actualizado: true });
    } else {
      await pool.query(
        'INSERT INTO calificaciones (perfil_id, contenido_id, tipo, estrellas) VALUES (?, ?, ?, ?)',
        [perfil_id, contenido_id, tipo, estrellas]
      );
      return res.json({ ok: true, creado: true });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al guardar calificación' });
  }
}

// Obtener calificaciones de un perfil
async function obtenerCalificaciones(req, res) {
  try {
    const { perfil_id } = req.params;
    if (!perfil_id) return res.status(400).json({ error: 'Falta perfil_id' });
    
    // Obtener calificaciones básicas
    const [rows] = await pool.query(
      `SELECT c.*, m.titulo, m.poster, m.poster_path
       FROM calificaciones c
       LEFT JOIN mi_lista m ON c.perfil_id = m.perfil_id AND c.tipo = m.tipo AND c.contenido_id = m.contenido_id
       WHERE c.perfil_id = ?
       ORDER BY c.fecha DESC`,
      [perfil_id]
    );
    
    // Siempre obtener datos actualizados de TMDB para cada calificación
    const axios = require('axios');
    const { API_KEY } = require('../configuracion/tmdb');
    
    // Procesar en paralelo para mayor eficiencia
    const resultados = await Promise.all(rows.map(async (item) => {
      try {
        // Siempre obtener datos frescos de TMDB
        const endpoint = item.tipo === 'movie' ? 'movie' : 'tv';
        const url = `https://api.themoviedb.org/3/${endpoint}/${item.contenido_id}?api_key=${API_KEY}`;
        const response = await axios.get(url);
        
        // Actualizar con datos de TMDB
        return {
          ...item,
          poster_path: response.data.poster_path,
          poster: `https://image.tmdb.org/t/p/w500${response.data.poster_path}`,
          titulo: response.data.title || response.data.name || item.titulo || item.contenido_id
        };
      } catch (error) {
        console.error(`Error al obtener datos de TMDB para ${item.tipo} ${item.contenido_id}:`, error.message);
        return item; // Devolver el item original si hay error
      }
    }));
    
    res.json(resultados);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener calificaciones' });
  }
}

module.exports = { guardarCalificacion, obtenerCalificaciones };

// Eliminar calificación
async function eliminarCalificacion(req, res) {
  try {
    const { perfil_id, contenido_id, tipo } = req.body;
    if (!perfil_id || !contenido_id || !tipo) return res.status(400).json({ error: 'Faltan datos para eliminar' });
    const [result] = await pool.query(
      'DELETE FROM calificaciones WHERE perfil_id = ? AND contenido_id = ? AND tipo = ?',
      [perfil_id, contenido_id, tipo]
    );
    res.json({ ok: true, affectedRows: result.affectedRows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al eliminar calificación' });
  }
}

module.exports.eliminarCalificacion = eliminarCalificacion;
