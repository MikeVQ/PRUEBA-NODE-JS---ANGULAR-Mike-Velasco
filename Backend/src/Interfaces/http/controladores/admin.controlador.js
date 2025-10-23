const { Usuario, RegistroSesion } = require('../../../Infraestructura/modelos');
const { Types } = require('mongoose');

function startOfUtcDay(d = new Date()) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
function addDays(date, days) {
  const x = new Date(date);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}
function subUtcDays(date, days) {
  return addDays(date, -days);
}

async function getIndicadores(req, res, next) {
  try {
    const [activos, inactivos, bloqueados] = await Promise.all([
      Usuario.countDocuments({ eliminado: { $ne: true }, status: 'ACTIVO' }),
      Usuario.countDocuments({ eliminado: { $ne: true }, status: 'INACTIVO' }),
      Usuario.countDocuments({ eliminado: { $ne: true }, status: 'BLOQUEADO' }),
    ]);

    const sesionesActivas = await RegistroSesion.countDocuments({ activo: true });

    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const intentosFallidos24h = await RegistroSesion.countDocuments({
      exito: false,
      inicio: { $gte: hace24h },
    });

    const hoy0 = startOfUtcDay();
    const hace7 = subUtcDays(hoy0, 7);
    const topFallosAgg = await RegistroSesion.aggregate([
      { $match: { exito: false, inicio: { $gte: hace7 } } },
      { $group: { _id: '$usuarioId', fallos: { $sum: 1 } } },
      { $sort: { fallos: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'usuarios',
          localField: '_id',
          foreignField: '_id',
          as: 'usuario',
        },
      },
      { $unwind: { path: '$usuario', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          usuarioId: '$_id',
          fallos: 1,
          username: '$usuario.username',
          nombres: '$usuario.nombres',
          apellidos: '$usuario.apellidos',
        },
      },
    ]);

    const fallosAgg = await RegistroSesion.aggregate([
      { $match: { exito: false, inicio: { $gte: hace7 } } },
      {
        $group: {
          _id: {
            y: { $year: '$inicio' },
            m: { $month: '$inicio' },
            d: { $dayOfMonth: '$inicio' },
          },
          c: { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
    ]);

    const serie = [];
    for (let i = 6; i >= 0; i--) {
      const d = subUtcDays(hoy0, i);
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth() + 1;
      const day = d.getUTCDate();
      const encontrado = fallosAgg.find(
        (x) => x._id.y === y && x._id.m === m && x._id.d === day
      );
      serie.push({
        fecha: d.toISOString(),
        fallos: encontrado ? encontrado.c : 0,
      });
    }

    res.json({
      usuariosActivos: activos,
      usuariosInactivos: inactivos,
      usuariosBloqueados: bloqueados,
      sesionesActivas,
      intentosFallidos24h,
      topFallos: topFallosAgg,
      fallosPorDia7d: serie,
    });
  } catch (err) {
    next(err);
  }
}

async function getSesionesUsuario(req, res, next) {
  try {
    const { usuarioId, page = 1, limit = 20 } = req.query;

    if (!usuarioId || !Types.ObjectId.isValid(usuarioId)) {
      return res.status(400).json({ error: 'usuarioId inválido' });
    }
    const uid = new Types.ObjectId(usuarioId);

    const user = await Usuario.findOne({ _id: uid, eliminado: { $ne: true } })
      .select('username nombres apellidos')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const p = Math.max(1, Number(page));
    const l = Math.max(1, Math.min(100, Number(limit)));
    const skip = (p - 1) * l;

    const filtro = { usuarioId: uid };

    const [items, total, activas] = await Promise.all([
      RegistroSesion.find(filtro)
        .sort({ inicio: -1 })
        .skip(skip)
        .limit(l)
        .lean(),
      RegistroSesion.countDocuments(filtro),
      RegistroSesion.countDocuments({ ...filtro, activo: true }),
    ]);

    const mapped = items.map((s) => ({
      _id: s._id.toString(),
      inicio: s.inicio,
      fin: s.fin || null,
      exito: !!s.exito,
      mensaje: s.mensaje || '',
      ip: s.ip || '',
      userAgent: s.userAgent || '',
      activo: !!s.activo,
    }));

    res.json({
      usuarioId,
      username: user.username,
      total,
      activas,
      items: mapped,
      page: p,
      limit: l,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getIndicadores,
  getSesionesUsuario,
};
