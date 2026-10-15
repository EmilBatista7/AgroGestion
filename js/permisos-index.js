// ==========================================
// OBTENER USUARIO ACTUAL
// ==========================================

const usuario = JSON.parse(localStorage.getItem("usuarioActual"));

// ==========================================
// VERIFICAR SESIÓN
// ==========================================

if (!usuario) {
  window.location.href = "pages/login.html";
}

// ==========================================
// ELEMENTOS DEL MENÚ
// ==========================================

const enlaceProveedores = document.getElementById("menuProveedores");

const enlaceCaja = document.getElementById("menuCaja");

const enlaceReportes = document.getElementById("menuReportes");

// ==========================================
// TARJETAS DE LOS MÓDULOS
// ==========================================

const tarjetaProveedores = document.getElementById("tarjetaProveedores");

const tarjetaCaja = document.getElementById("tarjetaCaja");

const tarjetaReportes = document.getElementById("tarjetaReportes");

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

  if (tarjetaProveedores) {
    tarjetaProveedores.style.display = "none";
  }

  if (tarjetaCaja) {
    tarjetaCaja.style.display = "none";
  }

  if (tarjetaReportes) {
    tarjetaReportes.style.display = "none";
  }
}
