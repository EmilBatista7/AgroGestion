// ==========================================
// COMPROBAR SESIÓN
// ==========================================

const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));

if (!usuarioActual) {
  window.location.replace("pages/login.html");
} else {
  // ==========================================
  // MOSTRAR USUARIO
  // ==========================================

  const elementoUsuario = document.getElementById("usuarioActual");

  if (elementoUsuario) {
    elementoUsuario.textContent = usuarioActual.usuario;
  }

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  const botonCerrarSesion = document.getElementById("cerrarSesion");

  if (botonCerrarSesion) {
    botonCerrarSesion.addEventListener("click", function () {
      localStorage.removeItem("usuarioActual");
      localStorage.removeItem("token");

      window.location.replace("pages/login.html");
    });
  }
}
