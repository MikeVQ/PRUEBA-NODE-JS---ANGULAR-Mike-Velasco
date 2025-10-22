// Regla: correo de la forma inicialNombre + apellido(s) base, ej: "jpiguavel@mail.com"
// Si existe duplicado, agregar sufijo numérico: jpiguavel1@mail.com, jpiguavel2@mail.com


function normalizarTexto(txt) {
  return (txt || '')
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '') 
    .replace(/\s+/g, ' ')
    .trim();
}

async function generarCorreoUnico({ nombres, apellidos, dominio = 'mail.com', UsuarioModel }) {
  const n = normalizarTexto(nombres);
  const a = normalizarTexto(apellidos);

  if (!n || !a) throw new Error('Nombres y apellidos requeridos para generar correo');

  const inicial = n[0] || '';               
  const apellidoBase = a.replace(/\s+/g, ''); 
  const base = `${inicial}${apellidoBase}`; 

  let candidato = `${base}@${dominio}`;
  let contador = 0;

  // verificar duplicados en usuarios activos y no eliminados

  while (await UsuarioModel.exists({ email: candidato, eliminado: { $ne: true } })) {
    contador += 1;
    candidato = `${base}${contador}@${dominio}`;
  }

  return candidato;
}

module.exports = { generarCorreoUnico };
