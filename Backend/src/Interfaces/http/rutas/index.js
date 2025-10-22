const { Router } = require('express');
const auth = require('./auth.rutas');
const usuarios = require('./usuarios.rutas');

const api = Router();

api.use('/auth', auth);
api.use('/usuarios', usuarios);

module.exports = api;
