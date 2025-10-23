// src/Aplicación/servicios/autentificacion.servicio.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, RegistroSesion, Rol } = require('../../Infraestructura/modelos');

const MAX_INTENTOS = 3;

async function login({ identificador, password, ip, userAgent }) {
  if (!identificador || !password) {
    throw new Error('identificador y password son requeridos');
  }

  const usuario = await Usuario.findOne({
    $or: [{ username: identificador }, { email: identificador }],
    eliminado: { $ne: true }
  });

  // Log de intento fallido si no existe
  if (!usuario) {
    await RegistroSesion.create({
      usuarioId: null,
      inicio: new Date(),
      fin: new Date(),
      exito: false,
      mensaje: 'Usuario no existe',
      ip,
      userAgent,
      activo: false
    });
    throw new Error('Credenciales inválidas');
  }

  // Bloqueado
  if (usuario.status === 'BLOQUEADO') {
    await RegistroSesion.create({
      usuarioId: usuario._id,
      inicio: new Date(),
      fin: new Date(),
      exito: false,
      mensaje: 'Usuario bloqueado',
      ip,
      userAgent,
      activo: false
    });
    throw new Error('Usuario bloqueado');
  }

  // contraseña
  const ok = await bcrypt.compare(password, usuario.passwordHash);
  if (!ok) {
    usuario.intentosFallidos = (usuario.intentosFallidos || 0) + 1;
    usuario.ultimoLoginFallido = new Date();

    let mensaje = 'Credenciales inválidas';
    if (usuario.intentosFallidos >= MAX_INTENTOS) {
      usuario.status = 'BLOQUEADO';
      mensaje = 'Usuario bloqueado por intentos fallidos';
    }
    await usuario.save();

    await RegistroSesion.create({
      usuarioId: usuario._id,
      inicio: new Date(),
      fin: new Date(),
      exito: false,
      mensaje,
      ip,
      userAgent,
      activo: false
    });

    throw new Error(mensaje);
  }

  // Reset intentos al éxito
  usuario.intentosFallidos = 0;
  await usuario.save();

  // Cerrar otras sesiones activas (solo 1 activa)
  await RegistroSesion.updateMany(
    { usuarioId: usuario._id, activo: true },
    { $set: { activo: false, fin: new Date() } }
  );

  // Crear sesión
  const reg = await RegistroSesion.create({
    usuarioId: usuario._id,
    inicio: new Date(),
    exito: true,
    mensaje: 'Login exitoso',
    ip,
    userAgent,
    activo: true
  });

  // Token
  const rol = await Rol.findById(usuario.rolId);
  const payload = {
    sub: usuario._id.toString(),
    username: usuario.username,
    rol: rol?.nombre || 'USUARIO'
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });

  return {
    token,
    usuario: {
      id: usuario._id.toString(),
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      username: usuario.username,
      rol: rol?.nombre || 'USUARIO',
      status: usuario.status
    },
    sesionId: reg._id.toString()
  };
}

async function logout({ usuarioId }) {
  if (!usuarioId) return { ok: true };
  await RegistroSesion.updateOne(
    { usuarioId, activo: true },
    { $set: { activo: false, fin: new Date() } }
  );
  return { ok: true };
}

async function bienvenida({ usuarioId }) {
  const usuario = await Usuario.findById(usuarioId);
  if (!usuario) throw new Error('Usuario no encontrado');

  // Última sesión (éxito o fallo)
  const ultima = await RegistroSesion.findOne({ usuarioId }).sort({ inicio: -1 });

  // Ventana de 24h para "recientes"
  const desde24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Fallos en últimas 24h
  const intentosFallidosRecientes24h = await RegistroSesion.countDocuments({
    usuarioId,
    exito: false,
    inicio: { $gte: desde24h }
  });

  // Fallos desde el último login exitoso
  const ultimoExito = await RegistroSesion.findOne({ usuarioId, exito: true }).sort({ inicio: -1 });
  let intentosFallidosDesdeUltimoExito = 0;
  if (ultimoExito) {
    intentosFallidosDesdeUltimoExito = await RegistroSesion.countDocuments({
      usuarioId,
      exito: false,
      inicio: { $gt: ultimoExito.inicio }
    });
  } else {
    // Si nunca hubo éxito, contamos todos los fallos
    intentosFallidosDesdeUltimoExito = await RegistroSesion.countDocuments({
      usuarioId,
      exito: false
    });
  }

  return {
    usuario: {
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      username: usuario.username,
      status: usuario.status,
      intentosFallidos: usuario.intentosFallidos || 0, // histórico de la cuenta de reintentos, se resetea al éxito
    },
    ultimaSesion: ultima
      ? {
          inicio: ultima.inicio,
          fin: ultima.fin || null,
          exito: ultima.exito,
          mensaje: ultima.mensaje,
        }
      : null,

    // NUEVOS CAMPOS (no rompen compatibilidad)
    recientes24hDesde: desde24h,
    intentosFallidosRecientes24h,
    intentosFallidosDesdeUltimoExito,
  };
}


module.exports = { login, logout, bienvenida };