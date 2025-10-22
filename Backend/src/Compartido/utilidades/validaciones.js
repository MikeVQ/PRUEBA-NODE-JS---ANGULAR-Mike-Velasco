
// parte de nombre de usuario con sus normas

function esUsernameValido(username) {
  if (typeof username !== 'string') return false;
  if (username.length < 8 || username.length > 20) return false;
  if (!/[A-Z]/.test(username)) return false;      
  if (!/\d/.test(username)) return false;          
  if (/[^A-Za-z0-9]/.test(username)) return false; 
  return true;
}

// parte de contraseña con sus normas

function esPasswordValida(password) {
  if (typeof password !== 'string') return false;
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;       
  if (/\s/.test(password)) return false;           
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

// parte de identificacion con sus normas

function esIdentificacionValida(identificacion) {
  if (typeof identificacion !== 'string') return false;
  if (!/^\d{10}$/.test(identificacion)) return false; 
  if (/(0{4}|1{4}|2{4}|3{4}|4{4}|5{4}|6{4}|7{4}|8{4}|9{4})/.test(identificacion)) return false;
  return true;
}

module.exports = {
  esUsernameValido,
  esPasswordValida,
  esIdentificacionValida,
};
