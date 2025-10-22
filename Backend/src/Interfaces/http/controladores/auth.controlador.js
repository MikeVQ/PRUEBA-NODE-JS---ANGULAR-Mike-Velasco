const { login, logout, bienvenida } = require('../../../Aplicación/servicios/autentificacion.servicio');

async function postLogin(req, res, next) {
  try {
    const { identificador, password } = req.body;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const data = await login({ identificador, password, ip, userAgent });
    res.json(data);
  } catch (err) { next(err); }
}

async function postLogout(req, res, next) {
  try {
    const usuarioId = req.usuario?.id;
    const data = await logout({ usuarioId });
    res.json(data);
  } catch (err) { next(err); }
}

async function getBienvenida(req, res, next) {
  try {
    const usuarioId = req.usuario?.id;
    const data = await bienvenida({ usuarioId });
    res.json(data);
  } catch (err) { next(err); }
}

module.exports = { postLogin, postLogout, getBienvenida };
