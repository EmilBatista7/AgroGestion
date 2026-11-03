const API_URL = "http://127.0.0.1:5001/api/clientes";

// Elementos del formulario
const formulario = document.getElementById("formCliente");
const tabla = document.getElementById("tablaClientes");
const botonGuardar = document.getElementById("botonGuardar");
const botonCancelar = document.getElementById("botonCancelar");
const tituloFormulario = document.getElementById("tituloFormulario");

// Clientes cargados desde MySQL
let clientes = [];

// ID del cliente que estamos editando
let idEditando = null;

// Mostrar errores
function mostrarError(error) {
  alert(error.message || "Ocurrió un error al comunicarse con el servidor.");
}

// Escapar texto para mostrarlo en la tabla
function escaparHTML(valor) {
  return String(valor ?? "").replace(
    /[&<>"']/g,
    (caracter) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[caracter],
  );
}

// Consultar clientes desde MySQL
async function cargarClientes() {
  try {
    const respuesta = await fetch(API_URL);

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.error || "No se pudieron consultar los clientes");
    }

    clientes = datos;

    mostrarClientes();
  } catch (error) {
    mostrarError(error);
  }
}

// Mostrar clientes en la tabla
function mostrarClientes() {
  tabla.innerHTML = "";

  clientes.forEach(function (cliente) {
    const fila = document.createElement("tr");

    fila.innerHTML = `
            <td>${escaparHTML(cliente.documento)}</td>
            <td>${escaparHTML(cliente.nombre)}</td>
            <td>${escaparHTML(cliente.telefono)}</td>
            <td>${escaparHTML(cliente.correo)}</td>
            <td>${escaparHTML(cliente.direccion)}</td>
            <td>${escaparHTML(cliente.tipo)}</td>
            <td>${escaparHTML(cliente.estado)}</td>

            <td>
                <button
                    class="btn btn-warning btn-sm"
                    onclick="editarCliente(${cliente.id})">
                    Editar
                </button>

                <button
                    class="btn btn-danger btn-sm"
                    onclick="eliminarCliente(${cliente.id})">
                    Eliminar
                </button>
            </td>
        `;

    tabla.appendChild(fila);
  });
}

// Guardar o actualizar cliente
formulario.addEventListener("submit", async function (event) {
  event.preventDefault();

  const cliente = {
    documento: document.getElementById("documento").value.trim(),
    nombre: document.getElementById("nombre").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    correo: document.getElementById("correo").value.trim(),
    direccion: document.getElementById("direccion").value.trim(),
    tipo: document.getElementById("tipo").value,
    estado: document.getElementById("estado").value,
  };

  try {
    const respuesta = await fetch(
      idEditando !== null ? `${API_URL}/${idEditando}` : API_URL,
      {
        method: idEditando !== null ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cliente),
      },
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo guardar el cliente");
    }

    alert(resultado.mensaje);

    formulario.reset();
    cancelarEdicion();

    await cargarClientes();
  } catch (error) {
    mostrarError(error);
  }
});

// Editar cliente
function editarCliente(id) {
  const cliente = clientes.find(function (elemento) {
    return elemento.id === id;
  });

  if (!cliente) {
    alert("No se encontró el cliente.");
    return;
  }

  document.getElementById("documento").value = cliente.documento;
  document.getElementById("nombre").value = cliente.nombre;
  document.getElementById("telefono").value = cliente.telefono;
  document.getElementById("correo").value = cliente.correo;
  document.getElementById("direccion").value = cliente.direccion;
  document.getElementById("tipo").value = cliente.tipo;
  document.getElementById("estado").value = cliente.estado;

  idEditando = id;

  tituloFormulario.innerHTML =
    '<i class="fa-solid fa-user-pen me-2"></i>Editar cliente';

  botonGuardar.textContent = "Actualizar cliente";

  botonCancelar.classList.remove("d-none");

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// Cancelar edición
botonCancelar.addEventListener("click", function () {
  cancelarEdicion();
});

function cancelarEdicion() {
  idEditando = null;

  formulario.reset();

  tituloFormulario.innerHTML =
    '<i class="fa-solid fa-user-plus me-2"></i>Registrar cliente';

  botonGuardar.textContent = "Guardar cliente";

  botonCancelar.classList.add("d-none");
}

// Eliminar cliente
async function eliminarCliente(id) {
  const confirmar = confirm("¿Está seguro de eliminar este cliente?");

  if (!confirmar) {
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo eliminar el cliente");
    }

    alert(resultado.mensaje);

    await cargarClientes();
  } catch (error) {
    mostrarError(error);
  }
}

// Consultar clientes al iniciar
cargarClientes();
