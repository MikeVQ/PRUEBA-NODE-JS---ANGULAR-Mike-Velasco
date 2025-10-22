const { Schema, model, Types } = require('mongoose');

const UsuarioSchema = new Schema({
  nombres: { type: String, required: true, trim: true },
  apellidos: { type: String, required: true, trim: true },
  identificacion: { type: String, required: true, trim: true }, 
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },

  // Estado de usuario
  status: { type: String, enum: ['ACTIVO', 'BLOQUEADO', 'INACTIVO'], default: 'ACTIVO' },

  // Reglas de intentos de login:
  intentosFallidos: { type: Number, default: 0 },
  ultimoLoginFallido: { type: Date },

  // Rol
  rolId: { type: Types.ObjectId, ref: 'Rol', required: true },

  cuentaId: { type: String, default: null },

  eliminado: { type: Boolean, default: false },
  eliminadoEn: { type: Date },
}, { timestamps: true });

UsuarioSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { eliminado: { $ne: true } } }
);
UsuarioSchema.index(
  { username: 1 },
  { unique: true, partialFilterExpression: { eliminado: { $ne: true } } }
);
UsuarioSchema.index(
  { identificacion: 1 },
  { unique: true, partialFilterExpression: { eliminado: { $ne: true } } }
);

module.exports = model('Usuario', UsuarioSchema);
