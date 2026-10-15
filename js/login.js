// ==========================================
// USUARIOS DEL SISTEMA
// ==========================================

const usuarios = [
  {
    usuario: "jefe",
    contrasena: "1234",
    rol: "jefe",
  },
  {
    usuario: "empleado",
    contrasena: "1234",
    rol: "empleado",
  },
];

// ==========================================
// FORMULARIO DE LOGIN
// ==========================================

const formulario = document.getElementById("formLogin");

const mensaje = document.getElementById("mensaje");

// ==========================================
// INICIAR SESIÓN
// ==========================================

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();

  const contrasena = document.getElementById("contrasena").value.trim();

  // Buscar usuario
  const usuarioEncontrado = usuarios.find(function (item) {
    return item.usuario === usuario && item.contrasena === contrasena;
  });

  // ==========================================
  // USUARIO CORRECTO
  // ==========================================

  if (usuarioEncontrado) {
    // Guardar sesión
    localStorage.setItem("usuarioActual", JSON.stringify(usuarioEncontrado));

    mensaje.innerHTML = `
            <div class="alert alert-success">
                Inicio de sesión correcto.
            </div>
        `;

    // Ir al inicio
    setTimeout(function () {
      window.location.href = "../index.html";
    }, 500);
  } else {
    // ==========================================
    // USUARIO INCORRECTO
    // ==========================================

    mensaje.innerHTML = `
            <div class="alert alert-danger">
                Usuario o contraseña incorrectos.
            </div>
        `;
  }
});
