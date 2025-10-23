const { Router } = require('express');
const auth = require('./auth.rutas');
const usuarios = require('./usuarios.rutas');
const sesiones = require('./sesiones.rutas'); // <-- NUEVO
const password = require('./password.rutas');
const admin = require('./admin.rutas');

const api = Router();

api.use('/auth', auth);
api.use('/usuarios', usuarios);
api.use('/sesiones', sesiones); // <-- NUEVO
api.use('/password', password);
api.use('/admin', admin);

module.exports = api;