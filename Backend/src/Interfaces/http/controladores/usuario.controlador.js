const { crearUsuario, actualizarUsuario, eliminarUsuarioLogico } = require('../../../Aplicación/servicios/usuario.servicio');
const { Usuario, Rol } = require('../../../Infraestructura/modelos');

async function postUsuario(req, res, next) {
  try {
    const data = await crearUsuario(req.body);
    res.status(201).json(data);
  } catch (err) { next(err); }
}

async function getUsuarios(req, res, next) {
  try {
    const { q, pagina = 1, limite = 10, estado } = req.query;
    const filtro = { eliminado: { $ne: true } };
    if (q) {
      filtro.$or = [
        { nombres: new RegExp(q, 'i') },
        { apellidos: new RegExp(q, 'i') },
        { username: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { identificacion: new RegExp(q, 'i') },
      ];
    }
    if (estado) filtro.status = estado;

    const skip = (Number(pagina) - 1) * Number(limite);
    const [items, total] = await Promise.all([
      Usuario.find(filtro).select('-passwordHash').skip(skip).limit(Number(limite)).lean(),
      Usuario.countDocuments(filtro)
    ]);
    res.json({ items, total, pagina: Number(pagina), limite: Number(limite) });
  } catch (err) { next(err); }
}

async function getUsuarioPorId(req, res, next) {
  try {
    const { id } = req.params;
    const u = await Usuario.findOne({ _id: id, eliminado: { $ne: true } }).select('-passwordHash').lean();
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(u);
  } catch (err) { next(err); }
}

async function putUsuario(req, res, next) {
  try {
    const { id } = req.params;
    const actor = { id: req.usuario?.id, rolNombre: req.usuario?.rol };
    const data = await actualizarUsuario(id, req.body, actor);
    res.json(data);
  } catch (err) { next(err); }
}

async function deleteUsuario(req, res, next) {
  try {
    const { id } = req.params;
    const actor = { id: req.usuario?.id, rolNombre: req.usuario?.rol };
    const data = await eliminarUsuarioLogico(id, actor);
    res.json(data);
  } catch (err) { next(err); }
}

module.exports = {
  postUsuario,
  getUsuarios,
  getUsuarioPorId,
  putUsuario,
  deleteUsuario
};
