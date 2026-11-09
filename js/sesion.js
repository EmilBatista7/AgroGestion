// ==========================================
// COMPROBAR SESIÓN - AGROGESTIÓN
// ==========================================

let usuarioActual = null;

try {
  usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
} catch (error) {
  console.error("No se pudo consultar la sesión:", error);
}

// ==========================================
// SI NO HAY SESIÓN
// ==========================================

if (!usuarioActual) {
  window.location.replace("login.html");
} else {
  // ==========================================
  // MOSTRAR NOMBRE DEL USUARIO
  // ==========================================

  const nombre = usuarioActual.usuario || usuarioActual.nombre || "Usuario";

  const elementoUsuario = document.getElementById("usuarioActual");
  const elementoNombre = document.getElementById("nombreUsuario");
  const elementoRol = document.getElementById("rolUsuario");

  if (elementoUsuario) {
    elementoUsuario.textContent = nombre;
  }

  if (elementoNombre) {
    elementoNombre.textContent = nombre;
  }

  if (elementoRol) {
    elementoRol.textContent = usuarioActual.rol || "Usuario";
  }

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  const botonCerrarSesion = document.getElementById("cerrarSesion");

  if (botonCerrarSesion) {
    botonCerrarSesion.addEventListener("click", function () {
      const confirmar = confirm("¿Estás seguro de que deseas cerrar sesión?");

      if (!confirmar) {
        return;
      }

      localStorage.removeItem("usuarioActual");
      localStorage.removeItem("token");

      window.location.replace("login.html");
    });
  }
}
