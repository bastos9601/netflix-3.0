const pool = require('../configuracion/basedatos');

// Guarda o actualiza progreso por perfil y contenido TMDB
async function guardarProgreso(req, res) {
  try {
    const { perfilId, tipo, contenidoId, segundo } = req.body;
    await pool.query(
      `INSERT INTO progreso_visualizacion (perfil_id, tipo, contenido_id, segundo)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE segundo = VALUES(segundo)`,
      [perfilId, tipo, contenidoId, segundo]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al guardar progreso' });
  }
}

async function obtenerProgreso(req, res) {
  try {
    const { perfilId, tipo, contenidoId } = req.query;
    const [filas] = await pool.query(
      'SELECT segundo FROM progreso_visualizacion WHERE perfil_id = ? AND tipo = ? AND contenido_id = ?',
      [perfilId, tipo, contenidoId]
    );
    const segundo = filas.length ? filas[0].segundo : 0;
    res.json({ segundo });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener progreso' });
  }
}

module.exports = { guardarProgreso, obtenerProgreso };