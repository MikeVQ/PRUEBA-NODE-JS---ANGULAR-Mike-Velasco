const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Usuario } = require('../../../Infraestructura/modelos');
const { esPasswordValida } = require('../../../Compartido/utilidades');

async function postRecuperar(req, res, next) {
  try {
    const { identificador } = req.body; // email o username
    if (!identificador) return res.status(400).json({ error: 'identificador es requerido' });

    const u = await Usuario.findOne({
      $or: [{ email: identificador }, { username: identificador }],
      eliminado: { $ne: true }
    });
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });

    const token = jwt.sign({ sub: u._id.toString(), tipo: 'reset' }, process.env.JWT_SECRET, { expiresIn: '15m' });
    // Aquí enviarías email con link: https://tuapp/reset?token=...
    // Para pruebas devolvemos el token:
    res.json({ ok: true, token });
  } catch (err) { next(err); }
}

async function postRestablecer(req, res, next) {
  try {
    const { token, nuevaPassword } = req.body;
    if (!token || !nuevaPassword) return res.status(400).json({ error: 'token y nuevaPassword son requeridos' });

    if (!esPasswordValida(nuevaPassword)) {
      return res.status(400).json({ error: 'Contraseña inválida (mín 8, 1 mayúscula, 1 signo, sin espacios)' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.tipo !== 'reset') return res.status(400).json({ error: 'Token inválido' });

    const u = await Usuario.findOne({ _id: payload.sub, eliminado: { $ne: true } });
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });

    u.passwordHash = await bcrypt.hash(nuevaPassword, 10);
    u.intentosFallidos = 0;
    if (u.status === 'BLOQUEADO') u.status = 'ACTIVO';
    await u.save();

    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { postRecuperar, postRestablecer };
