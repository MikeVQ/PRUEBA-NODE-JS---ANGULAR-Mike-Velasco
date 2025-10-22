const { Schema, model } = require('mongoose');

const RolSchema = new Schema({
  nombre: { type: String, required: true, trim: true }, 
  descripcion: { type: String },
  eliminado: { type: Boolean, default: false },
  eliminadoEn: { type: Date },
}, { timestamps: true });


RolSchema.index(
  { nombre: 1 },
  { name: 'uniq_nombre_no_eliminado', unique: true, partialFilterExpression: { eliminado: { $ne: true } } }
);

module.exports = model('Rol', RolSchema);
