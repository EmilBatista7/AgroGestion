// ==========================================
// FORMULARIO DE LOGIN
// ==========================================

const formulario = document.getElementById("formLogin");
const mensaje = document.getElementById("mensaje");

// ==========================================
// INICIAR SESIÓN
// ==========================================

formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();

  try {
    const respuesta = await fetch("http://127.0.0.1:5001/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usuario: usuario,
        contrasena: contrasena,
      }),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mensaje.innerHTML = `
                <div class="alert alert-danger">
                    ${datos.mensaje}
                </div>
            `;
      return;
    }

    // Guardar los datos del usuario en la sesión
    localStorage.setItem("token", datos.token);
    localStorage.setItem("usuarioActual", JSON.stringify(datos.usuario));

    mensaje.innerHTML = `
            <div class="alert alert-success">
                Inicio de sesión correcto.
            </div>
        `;

    setTimeout(function () {
      window.location.href = "../index.html";
    }, 500);
  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    mensaje.innerHTML = `
            <div class="alert alert-danger">
                No se pudo conectar con el servidor.
            </div>
        `;
  }
});
