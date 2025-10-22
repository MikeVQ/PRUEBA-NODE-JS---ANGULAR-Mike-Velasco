function manejoErrores(err, req, res, next) {
  console.error('!Error:', err?.message || err);
  if (res.headersSent) return next(err);
  const status = err.status || 400;
  return res.status(status).json({ error: err.message || 'Error inesperado' });
}

module.exports = { manejoErrores };
