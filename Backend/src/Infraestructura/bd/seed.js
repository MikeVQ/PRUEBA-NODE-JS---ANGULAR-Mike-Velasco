// src/Infraestructura/bd/seed.js
const bcrypt = require('bcryptjs');
const { Rol, Usuario } = require('../modelos');

async function seedRoles() {
  const base = ['ADMIN', 'USUARIO'];
  for (const nombre of base) {
    const existe = await Rol.findOne({ nombre, eliminado: { $ne: true } });
    if (!existe) {
      await Rol.create({ nombre, descripcion: `Rol ${nombre}` });
      console.log(`Rol creado: ${nombre}`);
    }
  }
}

async function seedAdmin() {
  const rolAdmin = await Rol.findOne({ nombre: 'ADMIN', eliminado: { $ne: true } });
  if (!rolAdmin) throw new Error('Rol ADMIN no existe (ejecuta seedRoles primero)');

 
  const ya = await Usuario.findOne({ username: 'AdminUser1', eliminado: { $ne: true } });
  if (ya) return;

  const password = 'Admin#1234';
  const passwordHash = await bcrypt.hash(password, 10);

  //cree mediante codigo para probar antes de pasar al frontend
  await Usuario.create({
    nombres: 'Admin',
    apellidos: 'Principal',
    identificacion: '1203574901', 
    username: 'AdminUser1',       
    email: 'admin@mail.com',
    passwordHash,
    rolId: rolAdmin._id,
    status: 'ACTIVO',
    intentosFallidos: 0
  });

  console.log('Usuario ADMIN inicial creado:');
  console.log('   username/email -> AdminUser1 / admin@mail.com');
  console.log('   password       -> Admin#1234');
}

module.exports = { seedRoles, seedAdmin };
