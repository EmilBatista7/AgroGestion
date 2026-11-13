
// ==========================================
// OBTENER USUARIO ACTUAL
// ==========================================

let usuario = null;

try {
    usuario = JSON.parse(localStorage.getItem("usuarioActual"));
} catch (error) {
    console.error("Error al obtener usuario:", error);
}

// ==========================================
// VERIFICAR SESION
// ==========================================

if (!usuario) {
    window.location.href = "pages/login.html";
}
