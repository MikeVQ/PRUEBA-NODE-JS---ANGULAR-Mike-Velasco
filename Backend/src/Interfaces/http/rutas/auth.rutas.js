const { Router } = require('express');
const { postLogin, postLogout, getBienvenida } = require('../controladores/auth.controlador');
const { requiereAuth } = require('../../middlewares/auth');

const r = Router();

r.post('/login', postLogin);
r.post('/logout', requiereAuth, postLogout);
r.get('/bienvenida', requiereAuth, getBienvenida);

module.exports = r;