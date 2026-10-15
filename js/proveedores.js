// Obtener proveedores desde LocalStorage

let proveedores = JSON.parse(localStorage.getItem("proveedores")) || [];

// Elementos del formulario

const formulario = document.getElementById("formProveedor");

const tabla = document.getElementById("tablaProveedores");

const botonGuardar = document.getElementById("botonGuardar");

const botonCancelar = document.getElementById("botonCancelar");

const tituloFormulario = document.getElementById("tituloFormulario");

// Índice del proveedor que estamos editando

let indiceEditando = -1;

// Mostrar proveedores

function mostrarProveedores() {
  tabla.innerHTML = "";

  proveedores.forEach(function (proveedor, indice) {
    const fila = document.createElement("tr");

    fila.innerHTML = `

            <td>${proveedor.nit}</td>

            <td>${proveedor.empresa}</td>

            <td>${proveedor.contacto}</td>

            <td>${proveedor.telefono}</td>

            <td>${proveedor.correo}</td>

            <td>${proveedor.direccion}</td>

            <td>${proveedor.estado}</td>

            <td>

                <button
                    class="btn btn-warning btn-sm"
                    onclick="editarProveedor(${indice})"
                >
                    Editar
                </button>


                <button
                    class="btn btn-danger btn-sm"
                    onclick="eliminarProveedor(${indice})"
                >
                    Eliminar
                </button>

            </td>

        `;

    tabla.appendChild(fila);
  });
}

// Guardar proveedor

formulario.addEventListener("submit", function (event) {
  event.preventDefault();

  const nit = document.getElementById("nit").value.trim();

  const empresa = document.getElementById("empresa").value.trim();

  const contacto = document.getElementById("contacto").value.trim();

  const telefono = document.getElementById("telefono").value.trim();

  const correo = document.getElementById("correo").value.trim();

  const direccion = document.getElementById("direccion").value.trim();

  const estado = document.getElementById("estado").value;

  // Verificar NIT repetido

  const nitRepetido = proveedores.some(function (proveedor, indice) {
    return (
      proveedor.nit.toLowerCase() === nit.toLowerCase() &&
      indice !== indiceEditando
    );
  });

  if (nitRepetido) {
    alert("Ya existe un proveedor con ese NIT.");

    return;
  }

  // Crear proveedor

  const proveedor = {
    nit: nit,

    empresa: empresa,

    contacto: contacto,

    telefono: telefono,

    correo: correo,

    direccion: direccion,

    estado: estado,
  };

  // Actualizar

  if (indiceEditando !== -1) {
    proveedores[indiceEditando] = proveedor;

    alert("Proveedor actualizado correctamente.");

    indiceEditando = -1;
  }

  // Registrar
  else {
    proveedores.push(proveedor);

    alert("Proveedor registrado correctamente.");
  }

  // Guardar

  localStorage.setItem("proveedores", JSON.stringify(proveedores));

  // Limpiar

  formulario.reset();

  cancelarEdicion();

  mostrarProveedores();
});

// Editar proveedor

function editarProveedor(indice) {
  const proveedor = proveedores[indice];

  document.getElementById("nit").value = proveedor.nit;

  document.getElementById("empresa").value = proveedor.empresa;

  document.getElementById("contacto").value = proveedor.contacto;

  document.getElementById("telefono").value = proveedor.telefono;

  document.getElementById("correo").value = proveedor.correo;

  document.getElementById("direccion").value = proveedor.direccion;

  document.getElementById("estado").value = proveedor.estado;

  indiceEditando = indice;

  tituloFormulario.textContent = "Editar proveedor";

  botonGuardar.textContent = "Actualizar proveedor";

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
  indiceEditando = -1;

  formulario.reset();

  tituloFormulario.textContent = "Registrar proveedor";

  botonGuardar.textContent = "Guardar proveedor";

  botonCancelar.classList.add("d-none");
}

// Eliminar proveedor

function eliminarProveedor(indice) {
  const confirmar = confirm("¿Está seguro de eliminar este proveedor?");

  if (confirmar) {
    proveedores.splice(indice, 1);

    localStorage.setItem("proveedores", JSON.stringify(proveedores));

    mostrarProveedores();

    alert("Proveedor eliminado correctamente.");
  }
}

// Mostrar proveedores al iniciar

mostrarProveedores();
