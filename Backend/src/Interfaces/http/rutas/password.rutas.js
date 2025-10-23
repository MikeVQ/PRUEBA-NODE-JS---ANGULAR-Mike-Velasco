const { Router } = require('express');
const { postRecuperar, postRestablecer } = require('../controladores/password.controlador');

const r = Router();
r.post('/recuperar', postRecuperar);
r.post('/restablecer', postRestablecer);
module.exports = r;