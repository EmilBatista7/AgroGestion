// ==========================================
// VERIFICAR USUARIO ACTUAL
// ==========================================

const usuario = JSON.parse(localStorage.getItem("usuarioActual"));

// ==========================================
// VERIFICAR SESIÓN
// ==========================================

if (!usuario) {
    window.location.replace("login.html");
}