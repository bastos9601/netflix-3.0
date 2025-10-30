// Controlador de perfiles:
// Listado, creación, actualización y eliminación de perfiles del usuario.
const pool = require('../configuracion/basedatos');

async function listarPerfiles(req, res) {
  try {
    const usuarioId = req.usuario?.uid || req.query.usuarioId;
    const [filas] = await pool.query('SELECT id, nombre, avatar FROM perfiles WHERE usuario_id = ?', [usuarioId]);
    res.json({ perfiles: filas });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar perfiles' });
  }
}

async function crearPerfil(req, res) {
  try {
    const usuarioId = req.usuario?.uid || req.body.usuarioId;
    const { nombre, avatar } = req.body;
    await pool.query('INSERT INTO perfiles (usuario_id, nombre, avatar) VALUES (?, ?, ?)', [usuarioId, nombre, avatar || null]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al crear perfil' });
  }
}

async function actualizarPerfil(req, res) {
  try {
    const usuarioId = req.usuario?.uid || req.body.usuarioId;
    const { id } = req.params;
    const { nombre, avatar } = req.body;
    
    const [resultado] = await pool.query(
      'UPDATE perfiles SET nombre = ?, avatar = ? WHERE id = ? AND usuario_id = ?',
      [nombre, avatar || null, id, usuarioId]
    );
    
    if (!resultado.affectedRows) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }
    
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
}

async function eliminarPerfil(req, res) {
  try {
    const usuarioId = req.usuario?.uid || req.body.usuarioId;
    const { id } = req.params;
    // Borrar progreso asociado, mi lista y luego el perfil del usuario
    await pool.query('DELETE FROM progreso_visualizacion WHERE perfil_id = ?', [id]);
    await pool.query('DELETE FROM mi_lista WHERE perfil_id = ?', [id]);
    const [resultado] = await pool.query('DELETE FROM perfiles WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
    if (!resultado.affectedRows) return res.status(404).json({ error: 'Perfil no encontrado' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al eliminar perfil' });
  }
}

module.exports = { listarPerfiles, crearPerfil, actualizarPerfil, eliminarPerfil };