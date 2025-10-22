const { Router } = require('express');
const { postUsuario, getUsuarios, getUsuarioPorId, putUsuario, deleteUsuario } = require('../controladores/usuario.controlador');
const { requiereAuth, requiereRol } = require('../../middlewares/auth');

const r = Router();

// Crear usuario
r.post('/', requiereAuth, requiereRol('ADMIN'), postUsuario);

// Listar a los usuarios
r.get('/', requiereAuth, requiereRol('ADMIN'), getUsuarios);

// Obtener
r.get('/:id', requiereAuth, getUsuarioPorId);

// Actualizar
r.put('/:id', requiereAuth, putUsuario);

// Eliminación lógica
r.delete('/:id', requiereAuth, requiereRol('ADMIN'), deleteUsuario);

module.exports = r;
