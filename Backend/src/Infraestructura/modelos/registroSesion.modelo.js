const { Schema, model, Types } = require('mongoose');

const RegistroSesionSchema = new Schema({
  usuarioId: { type: Types.ObjectId, ref: 'Usuario', required: true },
  inicio: { type: Date, required: true },
  fin: { type: Date },
  ip: { type: String },
  userAgent: { type: String },

  
  exito: { type: Boolean, required: true },
  mensaje: { type: String }, 

  // para la regla "solo 1 sesión activa"
  activo: { type: Boolean, default: false },
}, { timestamps: true });

RegistroSesionSchema.index({ usuarioId: 1, activo: 1 });

module.exports = model('RegistroSesion', RegistroSesionSchema);
