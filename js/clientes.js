// Obtener clientes guardados

let clientes = JSON.parse(localStorage.getItem("clientes")) || [];

// Elementos del formulario

const formulario = document.getElementById("formCliente");

const tabla = document.getElementById("tablaClientes");

const botonGuardar = document.getElementById("botonGuardar");

const botonCancelar = document.getElementById("botonCancelar");

const tituloFormulario = document.getElementById("tituloFormulario");

// Índice del cliente que estamos editando

let indiceEditando = -1;

// Mostrar clientes

function mostrarClientes() {
  tabla.innerHTML = "";

  clientes.forEach(function (cliente, indice) {
    const fila = document.createElement("tr");

    fila.innerHTML = `

            <td>${cliente.documento}</td>

            <td>${cliente.nombre}</td>

            <td>${cliente.telefono}</td>

            <td>${cliente.correo}</td>

            <td>${cliente.direccion}</td>

            <td>${cliente.tipo}</td>

            <td>${cliente.estado}</td>

            <td>

                <button
                    class="btn btn-warning btn-sm"
                    onclick="editarCliente(${indice})"
                >
                    Editar
                </button>


                <button
                    class="btn btn-danger btn-sm"
                    onclick="eliminarCliente(${indice})"
                >
                    Eliminar
                </button>

            </td>

        `;

    tabla.appendChild(fila);
  });
}

// Guardar cliente

formulario.addEventListener("submit", function (event) {
  event.preventDefault();

  const documento = document.getElementById("documento").value.trim();

  const nombre = document.getElementById("nombre").value.trim();

  const telefono = document.getElementById("telefono").value.trim();

  const correo = document.getElementById("correo").value.trim();

  const direccion = document.getElementById("direccion").value.trim();

  const tipo = document.getElementById("tipo").value;

  const estado = document.getElementById("estado").value;

  // Verificar documento repetido

  const documentoRepetido = clientes.some(function (cliente, indice) {
    return cliente.documento === documento && indice !== indiceEditando;
  });

  if (documentoRepetido) {
    alert("Ya existe un cliente con ese documento.");

    return;
  }

  // Crear objeto

  const cliente = {
    documento: documento,

    nombre: nombre,

    telefono: telefono,

    correo: correo,

    direccion: direccion,

    tipo: tipo,

    estado: estado,
  };

  // Editar

  if (indiceEditando !== -1) {
    clientes[indiceEditando] = cliente;

    alert("Cliente actualizado correctamente.");

    indiceEditando = -1;
  }

  // Crear
  else {
    clientes.push(cliente);

    alert("Cliente registrado correctamente.");
  }

  // Guardar

  localStorage.setItem("clientes", JSON.stringify(clientes));

  // Limpiar

  formulario.reset();

  cancelarEdicion();

  mostrarClientes();
});

// Editar cliente

function editarCliente(indice) {
  const cliente = clientes[indice];

  document.getElementById("documento").value = cliente.documento;

  document.getElementById("nombre").value = cliente.nombre;

  document.getElementById("telefono").value = cliente.telefono;

  document.getElementById("correo").value = cliente.correo;

  document.getElementById("direccion").value = cliente.direccion;

  document.getElementById("tipo").value = cliente.tipo;

  document.getElementById("estado").value = cliente.estado;

  indiceEditando = indice;

  tituloFormulario.textContent = "Editar cliente";

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
  indiceEditando = -1;

  formulario.reset();

  tituloFormulario.textContent = "Registrar cliente";

  botonGuardar.textContent = "Guardar cliente";

  botonCancelar.classList.add("d-none");
}

// Eliminar cliente

function eliminarCliente(indice) {
  const confirmar = confirm("¿Está seguro de eliminar este cliente?");

  if (confirmar) {
    clientes.splice(indice, 1);

    localStorage.setItem("clientes", JSON.stringify(clientes));

    mostrarClientes();

    alert("Cliente eliminado correctamente.");
  }
}

// Mostrar clientes al iniciar

mostrarClientes();
