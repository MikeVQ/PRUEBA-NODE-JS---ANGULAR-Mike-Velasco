require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { conectarMongo } = require('./src/Infraestructura/bd/mongo');
const { seedRoles, seedAdmin } = require('./src/Infraestructura/bd/seed');
const api = require('./src/Interfaces/http/rutas');
const { manejoErrores } = require('./src/Interfaces/middlewares/manejoErrores');

const app = express();


app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

const origenes = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: origenes.length ? origenes : true,
  credentials: true
}));

app.get('/salud', (req, res) => {
  res.json({
    ok: true,
    servicio: 'backend',
    entorno: process.env.NODE_ENV || 'development',
    hora: new Date().toISOString()
  });
});

app.use('/api', api);

app.use(manejoErrores);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

(async () => {
  await conectarMongo(MONGO_URI);
  await seedRoles();
  await seedAdmin();
  app.listen(PORT, () => {
    console.log(` Servidor escuchando en http://localhost:${PORT}`);
    console.log(` Healthcheck en        http://localhost:${PORT}/salud`);
    console.log(` API base en           http://localhost:${PORT}/api`);
  });
})();
