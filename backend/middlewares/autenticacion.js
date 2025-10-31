// Middleware de autenticación
// Verifica el token JWT en el header Authorization y adjunta el payload
const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  // Lee el header Authorization y extrae el token Bearer
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  // Responde 401 si no hay token
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    // Verifica el token con el secreto y adjunta el payload al request
    const payload = jwt.verify(token, process.env.JWT_SECRETO || 'secreto_dev');
    req.usuario = payload;
    next();
  } catch (e) {
    // Token inválido o expirado
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = { verificarToken };
