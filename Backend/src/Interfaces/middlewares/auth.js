const jwt = require('jsonwebtoken');
const { Rol, Usuario } = require('../../Infraestructura/modelos');

function requiereAuth(req, res, next) {
  try {
    const hdr = req.headers['authorization'] || '';
    const partes = hdr.split(' ');
    if (partes.length !== 2 || partes[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Token no provisto' });
    }
    const token = partes[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.usuario = {
      id: payload.sub,
      username: payload.username,
      rol: payload.rol || 'USUARIO'
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function requiereRol(rolRequerido) {
  return async (req, res, next) => {
    try {
      if (!req.usuario) return res.status(401).json({ error: 'No autenticado' });
      if (req.usuario.rol !== rolRequerido) {
        return res.status(403).json({ error: 'No autorizado: requiere rol ' + rolRequerido });
      }
      next();
    } catch (err) {
      return res.status(500).json({ error: 'Error verificando rol' });
    }
  };
}

module.exports = { requiereAuth, requiereRol };
