// Controlador de autenticación:
// Implementa registro/login tradicional, login por código (passwordless)
// y flujo de recuperación/restablecimiento de contraseña.
const pool = require('../configuracion/basedatos');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { enviarCorreo } = require('../util/correo');

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

// --- Nuevas funciones: login por código y recuperación de contraseña ---

function generarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
}

function generarToken() {
  return crypto.randomBytes(24).toString('hex');
}

async function solicitarCodigo(req, res) {
  try {
    const { correo } = req.body;
    if (!correo) return res.status(400).json({ error: 'Correo requerido' });
    const [rows] = await pool.query('SELECT id FROM usuarios WHERE correo = ?', [correo]);
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    const usuarioId = rows[0].id;
    const codigo = generarCodigo();
    await pool.query(
      `INSERT INTO codigos_ingreso (usuario_id, correo, codigo, expira_en, usado)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0)`,
      [usuarioId, correo, codigo]
    );
    // Enviar por correo
    const texto = `Tu código de inicio de sesión es: ${codigo}.\nCaduca en 10 minutos.`;
    await enviarCorreo({ para: correo, asunto: 'Código de inicio de sesión', texto });
    const expose = String(process.env.DEV_EXPOSE_CODES || '').toLowerCase() === 'true';
    res.json(expose ? { ok: true, codigo } : { ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al generar código' });
  }
}

async function ingresarConCodigo(req, res) {
  try {
    const { correo, codigo } = req.body;
    if (!correo || !codigo) return res.status(400).json({ error: 'Datos incompletos' });
    const [val] = await pool.query(
      `SELECT * FROM codigos_ingreso
       WHERE correo = ? AND codigo = ? AND usado = 0 AND expira_en > NOW()
       ORDER BY id DESC LIMIT 1`,
      [correo, codigo]
    );
    if (!val.length) return res.status(401).json({ error: 'Código inválido o expirado' });

    const row = val[0];
    await pool.query('UPDATE codigos_ingreso SET usado = 1 WHERE id = ?', [row.id]);

    const [usr] = await pool.query('SELECT id FROM usuarios WHERE id = ? OR correo = ? LIMIT 1', [row.usuario_id, correo]);
    if (!usr.length) return res.status(401).json({ error: 'Usuario no válido' });
    const uid = usr[0].id;
    const token = jwt.sign({ uid }, process.env.JWT_SECRETO || 'secreto_dev', { expiresIn: '7d' });
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al ingresar por código' });
  }
}

async function solicitarReset(req, res) {
  try {
    const { correo } = req.body;
    if (!correo) return res.status(400).json({ error: 'Correo requerido' });
    const [rows] = await pool.query('SELECT id FROM usuarios WHERE correo = ?', [correo]);
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    const usuarioId = rows[0].id;
    const token = generarToken();
    await pool.query(
      `INSERT INTO tokens_reset (usuario_id, correo, token, expira_en, usado)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE), 0)`,
      [usuarioId, correo, token]
    );
    const texto = `Para restablecer tu contraseña, usa este token en la app: ${token}.\nCaduca en 30 minutos.`;
    await enviarCorreo({ para: correo, asunto: 'Restablecer contraseña', texto });
    const expose = String(process.env.DEV_EXPOSE_CODES || '').toLowerCase() === 'true';
    res.json(expose ? { ok: true, token } : { ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al solicitar reset' });
  }
}

async function restablecerClave(req, res) {
  try {
    const { token, nueva_clave } = req.body;
    if (!token || !nueva_clave) return res.status(400).json({ error: 'Datos incompletos' });
    const [rows] = await pool.query(
      `SELECT * FROM tokens_reset WHERE token = ? AND usado = 0 AND expira_en > NOW() LIMIT 1`,
      [token]
    );
    if (!rows.length) return res.status(400).json({ error: 'Token inválido o expirado' });
    const row = rows[0];
    const hash = await bcrypt.hash(nueva_clave, 10);
    await pool.query('UPDATE usuarios SET clave_hash = ? WHERE id = ?', [hash, row.usuario_id]);
    await pool.query('UPDATE tokens_reset SET usado = 1 WHERE id = ?', [row.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al restablecer clave' });
  }
}

module.exports = { registrar, ingresar, solicitarCodigo, ingresarConCodigo, solicitarReset, restablecerClave };