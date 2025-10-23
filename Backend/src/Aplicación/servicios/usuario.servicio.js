const bcrypt = require('bcryptjs');
const { Usuario, Rol } = require('../../Infraestructura/modelos');
const { esUsernameValido, esPasswordValida, esIdentificacionValida, generarCorreoUnico } = require('../../Compartido/utilidades');

const SALT_ROUNDS = 10;

async function crearUsuario(dto) {
  const {
    nombres, apellidos, identificacion,
    username, password, rolNombre = 'USUARIO', cuentaId = null
  } = dto;

  if (!esIdentificacionValida(identificacion)) {
    throw new Error('Identificación inválida: 10 dígitos, solo números y sin repetir 4 iguales seguidos.');
  }
  if (!esUsernameValido(username)) {
    throw new Error('Username inválido: 8-20, al menos 1 mayúscula y 1 número, sin signos.');
  }
  if (!esPasswordValida(password)) {
    throw new Error('Contraseña inválida: mínimo 8, al menos 1 mayúscula, sin espacios y con al menos 1 signo.');
  }

  const rol = await Rol.findOne({ nombre: rolNombre, eliminado: { $ne: true } });
  if (!rol) throw new Error(`Rol no encontrado: ${rolNombre}`);

  const email = await generarCorreoUnico({ nombres, apellidos, dominio: 'mail.com', UsuarioModel: Usuario });

  const dup = await Usuario.findOne({
    $or: [
      { username, eliminado: { $ne: true } },
      { identificacion, eliminado: { $ne: true } },
      { email, eliminado: { $ne: true } },
    ]
  });
  if (dup) throw new Error('Usuario duplicado (username/email/identificación).');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const usuario = await Usuario.create({
    nombres, apellidos, identificacion,
    username, email, passwordHash,
    rolId: rol._id,
    status: 'ACTIVO',
    intentosFallidos: 0,
    cuentaId,
  });

  return {
    id: usuario._id.toString(),
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    username: usuario.username,
    email: usuario.email,
    rol: rol.nombre,
    status: usuario.status
  };
}

async function actualizarUsuario(id, cambios, actor) {
  const usuario = await Usuario.findOne({ _id: id, eliminado: { $ne: true } });
  if (!usuario) throw new Error('Usuario no encontrado');

  const actorEsAdmin = actor?.rolNombre === 'ADMIN';

  if (!actorEsAdmin && actor?.id !== usuario._id.toString()) {
    throw new Error('No autorizado para actualizar este usuario.');
  }

  const rolAdmin = await Rol.findOne({ nombre: 'ADMIN', eliminado: { $ne: true } }, { _id: 1 });
  const objetivoEsAdmin = rolAdmin && usuario.rolId?.toString() === rolAdmin._id.toString();

  if (objetivoEsAdmin && actor?.id !== usuario._id.toString()) {
    throw new Error('Un ADMIN no puede editar a otro ADMIN.');
  }
  
  
  if (cambios.rolNombre) {
    if (!actorEsAdmin) throw new Error('Solo ADMIN puede cambiar roles');
    const rolDestino = await Rol.findOne({ nombre: cambios.rolNombre, eliminado: { $ne: true } });
    if (!rolDestino) throw new Error('Rol destino no existe');

    
    if (rolDestino.nombre === 'ADMIN' && actor?.id !== usuario._id.toString()) {
      throw new Error('No se permite escalar a ADMIN desde esta acción.');
    }

  
    if (objetivoEsAdmin && actor?.id !== usuario._id.toString()) {
      throw new Error('Un ADMIN no puede cambiar el rol de otro ADMIN.');
    }

    usuario.rolId = rolDestino._id;
  }

 
  if (cambios.username) {
    if (!esUsernameValido(cambios.username)) throw new Error('Username inválido');
    const existe = await Usuario.exists({ _id: { $ne: usuario._id }, username: cambios.username, eliminado: { $ne: true } });
    if (existe) throw new Error('Username ya está en uso');
    usuario.username = cambios.username;
  }

  
  if (cambios.password) {
    if (!esPasswordValida(cambios.password)) throw new Error('Contraseña inválida');
    usuario.passwordHash = await bcrypt.hash(cambios.password, SALT_ROUNDS);
  }

  
  if (cambios.identificacion) {
    if (!esIdentificacionValida(cambios.identificacion)) throw new Error('Identificación inválida');
    const existe = await Usuario.exists({ _id: { $ne: usuario._id }, identificacion: cambios.identificacion, eliminado: { $ne: true } });
    if (existe) throw new Error('Identificación ya está registrada');
    usuario.identificacion = cambios.identificacion;
  }

  
  if (typeof cambios.status === 'string') {
    if (!['ACTIVO', 'BLOQUEADO', 'INACTIVO'].includes(cambios.status)) {
      throw new Error('Estado inválido');
    }
    if (!actorEsAdmin && actor?.id !== usuario._id.toString()) {
      throw new Error('No autorizado para cambiar estado');
    }
    if (objetivoEsAdmin && actor?.id !== usuario._id.toString()) {
      throw new Error('Un ADMIN no puede cambiar el estado de otro ADMIN.');
    }
    usuario.status = cambios.status;
  }

  
  if (cambios.nombres) usuario.nombres = cambios.nombres;
  if (cambios.apellidos) usuario.apellidos = cambios.apellidos;

  
  if (typeof cambios.email === 'string' && cambios.email.trim()) {
    const em = cambios.email.trim().toLowerCase();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(em)) throw new Error('Email inválido');
    const ocupado = await Usuario.exists({ _id: { $ne: usuario._id }, email: em, eliminado: { $ne: true } });
    if (ocupado) throw new Error('Email ya está en uso');
    usuario.email = em;
  }

  await usuario.save();

  return {
    id: usuario._id.toString(),
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    username: usuario.username,
    email: usuario.email,
    status: usuario.status
  };
}


async function eliminarUsuarioLogico(id, actor) {
  const usuario = await Usuario.findOne({ _id: id, eliminado: { $ne: true } }).populate('rolId');
  if (!usuario) throw new Error('Usuario no encontrado');
  const actorEsAdmin = actor?.rolNombre === 'ADMIN';
  if (!actorEsAdmin) throw new Error('Solo ADMIN puede eliminar usuarios.');

  // No eliminar admins
  const rolUsuario = await Rol.findById(usuario.rolId);
  if (rolUsuario?.nombre === 'ADMIN') throw new Error('No se puede eliminar a un ADMIN.');

  usuario.eliminado = true;
  usuario.eliminadoEn = new Date();
  await usuario.save();
  return { ok: true };
}

module.exports = {
  crearUsuario,
  actualizarUsuario,
  eliminarUsuarioLogico,
};
