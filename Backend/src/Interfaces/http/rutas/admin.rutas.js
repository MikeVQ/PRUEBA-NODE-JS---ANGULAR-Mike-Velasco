const { Router } = require('express');
const { requiereAuth, requiereRol } = require('../../middlewares/auth');
const { getIndicadores, getSesionesUsuario } = require('../controladores/admin.controlador');

const r = Router();

r.get('/indicadores', requiereAuth, requiereRol('ADMIN'), getIndicadores);

r.get('/sesiones', requiereAuth, requiereRol('ADMIN'), getSesionesUsuario);

module.exports = r;
