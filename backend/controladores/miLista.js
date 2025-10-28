const pool = require('../configuracion/basedatos');

async function obtenerMiLista(req, res) {
  try {
    const perfilId = req.params.perfilId;
    const [filas] = await pool.query(
      'SELECT tipo, contenido_id, titulo, poster, agregado_en FROM mi_lista WHERE perfil_id = ? ORDER BY agregado_en DESC',
      [perfilId]
    );
    res.json({ miLista: filas });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener Mi Lista' });
  }
}

async function agregarAMiLista(req, res) {
  try {
    const perfilId = req.params.perfilId;
    const { tipo, contenido_id, titulo, poster } = req.body;
    
    // Verificar si ya existe
    const [existente] = await pool.query(
      'SELECT 1 FROM mi_lista WHERE perfil_id = ? AND tipo = ? AND contenido_id = ?',
      [perfilId, tipo, contenido_id]
    );
    
    if (existente.length > 0) {
      return res.status(400).json({ error: 'Ya está en Mi Lista' });
    }
    
    await pool.query(
      'INSERT INTO mi_lista (perfil_id, tipo, contenido_id, titulo, poster) VALUES (?, ?, ?, ?, ?)',
      [perfilId, tipo, contenido_id, titulo, poster]
    );
    
    res.json({ ok: true, mensaje: 'Agregado a Mi Lista' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al agregar a Mi Lista' });
  }
}

async function quitarDeMiLista(req, res) {
  try {
    const perfilId = req.params.perfilId;
    const { tipo, contenido_id } = req.body;
    
    const [resultado] = await pool.query(
      'DELETE FROM mi_lista WHERE perfil_id = ? AND tipo = ? AND contenido_id = ?',
      [perfilId, tipo, contenido_id]
    );
    
    if (!resultado.affectedRows) {
      return res.status(404).json({ error: 'No encontrado en Mi Lista' });
    }
    
    res.json({ ok: true, mensaje: 'Quitado de Mi Lista' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al quitar de Mi Lista' });
  }
}

async function verificarEnMiLista(req, res) {
  try {
    const perfilId = req.params.perfilId;
    const { tipo, contenido_id } = req.query;
    
    const [filas] = await pool.query(
      'SELECT 1 FROM mi_lista WHERE perfil_id = ? AND tipo = ? AND contenido_id = ?',
      [perfilId, tipo, contenido_id]
    );
    
    res.json({ enMiLista: filas.length > 0 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al verificar Mi Lista' });
  }
}

module.exports = { obtenerMiLista, agregarAMiLista, quitarDeMiLista, verificarEnMiLista };