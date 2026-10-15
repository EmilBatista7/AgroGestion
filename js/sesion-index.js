// ==========================================
// COMPROBAR SESIÓN
// ==========================================

const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));

if (!usuarioActual) {
  window.location.href = "pages/login.html";
}

// ==========================================
// MOSTRAR USUARIO
// ==========================================

const elementoUsuario = document.getElementById("usuarioActual");

if (elementoUsuario && usuarioActual) {
  elementoUsuario.textContent = usuarioActual.usuario;
}

// ==========================================
// CERRAR SESIÓN
// ==========================================

const botonCerrarSesion = document.getElementById("cerrarSesion");

if (botonCerrarSesion) {
  botonCerrarSesion.addEventListener("click", function () {
    localStorage.removeItem("usuarioActual");

    window.location.href = "pages/login.html";
  });
}
