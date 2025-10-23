const { crearUsuario, actualizarUsuario, eliminarUsuarioLogico } = require('../../../Aplicación/servicios/usuario.servicio');
const { Usuario } = require('../../../Infraestructura/modelos');

async function postUsuario(req, res, next) {
  try {
    const data = await crearUsuario(req.body);
    res.status(201).json(data);
  } catch (err) { next(err); }
}

async function getUsuarios(req, res, next) {
  try {
  
    const q = req.query.q || '';
    const page = Number(req.query.page ?? req.query.pagina ?? 1);
    const limit = Number(req.query.limit ?? req.query.limite ?? 10);
    const estado = req.query.estado;

    const filtros = { eliminado: { $ne: true } };
    if (q) {
      filtros.$or = [
        { nombres: { $regex: q, $options: 'i' } },
        { apellidos: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { identificacion: { $regex: q, $options: 'i' } },
      ];
    }
    if (estado) filtros.status = estado;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Usuario.find(filtros)
        .select('-passwordHash')
        .populate('rolId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Usuario.countDocuments(filtros),
    ]);


    const data = items.map(u => ({
      id: u._id.toString(),
      nombres: u.nombres,
      apellidos: u.apellidos,
      identificacion: u.identificacion,
      username: u.username,
      email: u.email,
      rol: u.rolId?.nombre || 'USUARIO', 
      status: u.status,
      creadoEn: u.createdAt,
    }));

    res.json({ data, total, page, limit });
  } catch (err) { next(err); }
}

module.exports = { getUsuarios };

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
