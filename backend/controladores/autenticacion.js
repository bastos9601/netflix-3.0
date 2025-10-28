// Controlador de autenticación (registro, login)
const pool = require('../configuracion/basedatos');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function registrar(req, res) {
  try {
    const { correo, clave } = req.body;
    if (!correo || !clave) return res.status(400).json({ error: 'Datos incompletos' });
    const [existe] = await pool.query('SELECT id FROM usuarios WHERE correo = ?', [correo]);
    if (existe.length) return res.status(409).json({ error: 'Usuario ya existe' });
    const hash = await bcrypt.hash(clave, 10);
    await pool.query('INSERT INTO usuarios (correo, clave_hash) VALUES (?, ?)', [correo, hash]);
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al registrar' });
  }
}

async function ingresar(req, res) {
  try {
    const { correo, clave } = req.body;
    const [filas] = await pool.query('SELECT id, clave_hash FROM usuarios WHERE correo = ?', [correo]);
    if (!filas.length) return res.status(401).json({ error: 'Credenciales inválidas' });
    const usuario = filas[0];
    const ok = await bcrypt.compare(clave, usuario.clave_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });
    const token = jwt.sign({ uid: usuario.id }, process.env.JWT_SECRETO || 'secreto_dev', { expiresIn: '7d' });
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al ingresar' });
  }
}

module.exports = { registrar, ingresar };