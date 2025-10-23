const { Router } = require('express');
const { requiereAuth, requiereRol } = require('../../middlewares/auth');
const { getSesiones } = require('../controladores/sesion.controlador');

const r = Router();

r.get('/', requiereAuth, requiereRol('ADMIN'), getSesiones);

module.exports = r;
