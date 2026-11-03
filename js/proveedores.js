// Dirección de la API de proveedores
const API_URL = "http://127.0.0.1:5001/api/proveedores";

// Elementos del formulario
const formulario = document.getElementById("formProveedor");
const tabla = document.getElementById("tablaProveedores");
const botonGuardar = document.getElementById("botonGuardar");
const botonCancelar = document.getElementById("botonCancelar");
const tituloFormulario = document.getElementById("tituloFormulario");

// ID del proveedor que estamos editando
let idEditando = null;

// Escapar texto para evitar insertar HTML no deseado
function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, function (caracter) {
    const caracteres = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return caracteres[caracter];
  });
}

// Consultar proveedores desde MySQL
async function cargarProveedores() {
  try {
    const respuesta = await fetch(API_URL);

    const proveedores = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        proveedores.error || "No se pudieron consultar los proveedores",
      );
    }

    mostrarProveedores(proveedores);
  } catch (error) {
    console.error("Error al consultar proveedores:", error);

    tabla.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">
                    No fue posible cargar los proveedores.
                </td>
            </tr>
        `;
  }
}

// Mostrar proveedores en la tabla
function mostrarProveedores(proveedores) {
  tabla.innerHTML = "";

  if (proveedores.length === 0) {
    tabla.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">
                    No hay proveedores registrados.
                </td>
            </tr>
        `;

    return;
  }

  proveedores.forEach(function (proveedor) {
    const fila = document.createElement("tr");

    fila.innerHTML = `
            <td>${escaparHTML(proveedor.nit)}</td>

            <td>${escaparHTML(proveedor.empresa)}</td>

            <td>${escaparHTML(proveedor.contacto)}</td>

            <td>${escaparHTML(proveedor.telefono)}</td>

            <td>${escaparHTML(proveedor.correo)}</td>

            <td>${escaparHTML(proveedor.direccion)}</td>

            <td>${escaparHTML(proveedor.estado)}</td>

            <td>
                <button
                    class="btn btn-warning btn-sm"
                    onclick="editarProveedor(${proveedor.id})">
                    Editar
                </button>

                <button
                    class="btn btn-danger btn-sm"
                    onclick="eliminarProveedor(${proveedor.id})">
                    Eliminar
                </button>
            </td>
        `;

    tabla.appendChild(fila);
  });
}

// Obtener datos del formulario
function obtenerDatosFormulario() {
  return {
    nit: document.getElementById("nit").value.trim(),
    empresa: document.getElementById("empresa").value.trim(),
    contacto: document.getElementById("contacto").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    correo: document.getElementById("correo").value.trim(),
    direccion: document.getElementById("direccion").value.trim(),
    estado: document.getElementById("estado").value,
  };
}

// Guardar o actualizar proveedor
formulario.addEventListener("submit", async function (event) {
  event.preventDefault();

  const proveedor = obtenerDatosFormulario();

  const metodo = idEditando === null ? "POST" : "PUT";

  const url = idEditando === null ? API_URL : `${API_URL}/${idEditando}`;

  try {
    botonGuardar.disabled = true;

    const respuesta = await fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(proveedor),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo guardar el proveedor");
    }

    alert(resultado.mensaje);

    formulario.reset();

    cancelarEdicion();

    await cargarProveedores();
  } catch (error) {
    console.error("Error al guardar proveedor:", error);
    alert(error.message);
  } finally {
    botonGuardar.disabled = false;
  }
});

// Editar proveedor
async function editarProveedor(id) {
  try {
    const respuesta = await fetch(API_URL);

    const proveedores = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        proveedores.error || "No se pudieron consultar los proveedores",
      );
    }

    const proveedor = proveedores.find(function (elemento) {
      return elemento.id === id;
    });

    if (!proveedor) {
      alert("No se encontró el proveedor.");
      return;
    }

    document.getElementById("nit").value = proveedor.nit;
    document.getElementById("empresa").value = proveedor.empresa;
    document.getElementById("contacto").value = proveedor.contacto;
    document.getElementById("telefono").value = proveedor.telefono;
    document.getElementById("correo").value = proveedor.correo;
    document.getElementById("direccion").value = proveedor.direccion;
    document.getElementById("estado").value = proveedor.estado;

    idEditando = proveedor.id;

    tituloFormulario.textContent = "Editar proveedor";

    botonGuardar.textContent = "Actualizar proveedor";

    botonCancelar.classList.remove("d-none");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } catch (error) {
    console.error("Error al editar proveedor:", error);
    alert(error.message);
  }
}

// Cancelar edición
botonCancelar.addEventListener("click", function () {
  cancelarEdicion();
});

function cancelarEdicion() {
  idEditando = null;

  formulario.reset();

  tituloFormulario.innerHTML = `
        <i class="fa-solid fa-building-circle-check me-2"></i>
        Registrar proveedor
    `;

  botonGuardar.innerHTML = `
        <i class="fa-solid fa-floppy-disk me-2"></i>
        Guardar proveedor
    `;

  botonCancelar.classList.add("d-none");
}

// Eliminar proveedor
async function eliminarProveedor(id) {
  const confirmar = confirm("¿Está seguro de eliminar este proveedor?");

  if (!confirmar) {
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo eliminar el proveedor");
    }

    alert(resultado.mensaje);

    await cargarProveedores();
  } catch (error) {
    console.error("Error al eliminar proveedor:", error);
    alert(error.message);
  }
}

// Cargar proveedores al iniciar
cargarProveedores();
