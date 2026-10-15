// ==========================================
// OBTENER USUARIO ACTUAL
// ==========================================

const usuario = JSON.parse(localStorage.getItem("usuarioActual"));

// ==========================================
// VERIFICAR SESIÓN
// ==========================================

if (!usuario) {
  window.location.href = "login.html";
}

// ==========================================
// ELEMENTOS DEL MENÚ
// ==========================================

const enlaceProveedores = document.getElementById("menuProveedores");

const enlaceCaja = document.getElementById("menuCaja");

const enlaceReportes = document.getElementById("menuReportes");

// ==========================================
// OCULTAR OPCIONES PARA EMPLEADO
// ==========================================

if (usuario && usuario.rol === "empleado") {
  if (enlaceProveedores) {
    enlaceProveedores.style.display = "none";
  }

  if (enlaceCaja) {
    enlaceCaja.style.display = "none";
  }

  if (enlaceReportes) {
    enlaceReportes.style.display = "none";
  }
}

// ==========================================
// PROTEGER PÁGINAS EXCLUSIVAS DEL JEFE
// ==========================================

const paginaActual = window.location.pathname.toLowerCase();

// Proveedores

if (
  paginaActual.includes("proveedores.html") &&
  usuario &&
  usuario.rol !== "jefe"
) {
  alert("No tiene permisos para acceder a esta sección.");

  window.location.href = "productos.html";
}

// Caja

if (paginaActual.includes("caja.html") && usuario && usuario.rol !== "jefe") {
  alert("No tiene permisos para acceder a esta sección.");

  window.location.href = "productos.html";
}

// Reportes

if (
  paginaActual.includes("reportes.html") &&
  usuario &&
  usuario.rol !== "jefe"
) {
  alert("No tiene permisos para acceder a esta sección.");

  window.location.href = "productos.html";
}
