// Middleware de autenticación:
// Verifica el token JWT en el header Authorization y adjunta el payload.
const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRETO || 'secreto_dev');
    req.usuario = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = { verificarToken };