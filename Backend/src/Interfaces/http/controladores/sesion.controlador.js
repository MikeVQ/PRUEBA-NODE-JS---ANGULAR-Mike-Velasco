const { RegistroSesion, Usuario } = require('../../../Infraestructura/modelos');

async function getSesiones(req, res, next) {
  try {
    const { usuarioId, exito, activo } = req.query;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (!usuarioId) {
      return res.status(400).json({ error: 'usuarioId es requerido' });
    }

    const existe = await Usuario.exists({ _id: usuarioId, eliminado: { $ne: true } });
    if (!existe) return res.status(404).json({ error: 'Usuario no encontrado' });

    const filtro = { usuarioId };
    if (exito === 'true') filtro.exito = true;
    if (exito === 'false') filtro.exito = false;
    if (activo === 'true') filtro.activo = true;
    if (activo === 'false') filtro.activo = false;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      RegistroSesion.find(filtro)
        .sort({ inicio: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RegistroSesion.countDocuments(filtro)
    ]);

    const data = items.map(s => ({
      id: s._id.toString(),
      inicio: s.inicio,
      fin: s.fin || null,
      exito: !!s.exito,
      mensaje: s.mensaje || null,
      ip: s.ip || null,
      userAgent: s.userAgent || null,
      activo: !!s.activo,
      creadoEn: s.createdAt,
    }));

    res.json({ data, total, page, limit });
  } catch (err) { next(err); }
}

module.exports = { getSesiones };
