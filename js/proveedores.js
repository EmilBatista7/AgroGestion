
// ==========================================
// DIRECCION DE LA API
// ==========================================

const API_URL = "http://127.0.0.1:5001/api/proveedores";

// ==========================================
// OBTENER USUARIO ACTUAL
// ==========================================

const usuario = JSON.parse(localStorage.getItem("usuarioActual"));

const esEmpleado = usuario && usuario.rol === "empleado";

// ==========================================
// ELEMENTOS DEL FORMULARIO
// ==========================================

const formulario = document.getElementById("formProveedor");
const tabla = document.getElementById("tablaProveedores");
const botonGuardar = document.getElementById("botonGuardar");
const botonCancelar = document.getElementById("botonCancelar");
const tituloFormulario = document.getElementById("tituloFormulario");

// Ocultar formulario para empleados
if (esEmpleado && formulario) {
    formulario.closest(".agro-panel").style.display = "none";
}

// ==========================================
// ID DEL PROVEEDOR EN EDICION
// ==========================================

let idEditando = null;

// ==========================================
// ESCAPAR HTML
// ==========================================

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, function (caracter) {
        const caracteres = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return caracteres[caracter];
    });
}

// ==========================================
// CONSULTAR PROVEEDORES
// ==========================================

async function cargarProveedores() {
    try {
        const respuesta = await fetch(API_URL);
        const proveedores = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(proveedores.error || "No se pudieron consultar los proveedores");
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

// ==========================================
// MOSTRAR PROVEEDORES
// ==========================================

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

        let acciones = "";

        // Solo el jefe puede editar y eliminar
        if (!esEmpleado) {
            acciones = `
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
            `;
        } else {
            acciones = `
                <span class="text-muted">Solo consulta</span>
            `;
        }

        fila.innerHTML = `
            <td>${escaparHTML(proveedor.nit)}</td>
            <td>${escaparHTML(proveedor.empresa)}</td>
            <td>${escaparHTML(proveedor.contacto)}</td>
            <td>${escaparHTML(proveedor.telefono)}</td>
            <td>${escaparHTML(proveedor.correo)}</td>
            <td>${escaparHTML(proveedor.direccion)}</td>
            <td>${escaparHTML(proveedor.estado)}</td>
            <td>${acciones}</td>
        `;

        tabla.appendChild(fila);
    });
}

// ==========================================
// OBTENER DATOS DEL FORMULARIO
// ==========================================

function obtenerDatosFormulario() {
    return {
        nit: document.getElementById("nit").value.trim(),
        empresa: document.getElementById("empresa").value.trim(),
        contacto: document.getElementById("contacto").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        correo: document.getElementById("correo").value.trim(),
        direccion: document.getElementById("direccion").value.trim(),
        estado: document.getElementById("estado").value
    };
}

// ==========================================
// GUARDAR O ACTUALIZAR PROVEEDOR
// ==========================================

if (!esEmpleado) {
    formulario.addEventListener("submit", async function (event) {
        event.preventDefault();

        const proveedor = obtenerDatosFormulario();

        const metodo = idEditando === null ? "POST" : "PUT";

        const url = idEditando === null
            ? API_URL
            : `${API_URL}/${idEditando}`;

        try {
            botonGuardar.disabled = true;

            const respuesta = await fetch(url, {
                method: metodo,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(proveedor)
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
}

// ==========================================
// EDITAR PROVEEDOR
// ==========================================

async function editarProveedor(id) {
    if (esEmpleado) return;

    try {
        const respuesta = await fetch(API_URL);
        const proveedores = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(proveedores.error || "No se pudieron consultar los proveedores");
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
            behavior: "smooth"
        });

    } catch (error) {
        console.error("Error al editar proveedor:", error);
        alert(error.message);
    }
}

// ==========================================
// CANCELAR EDICION
// ==========================================

if (!esEmpleado) {
    botonCancelar.addEventListener("click", function () {
        cancelarEdicion();
    });
}

function cancelarEdicion() {
    if (esEmpleado) return;

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

// ==========================================
// ELIMINAR PROVEEDOR
// ==========================================

async function eliminarProveedor(id) {
    if (esEmpleado) return;

    const confirmar = confirm("¿Está seguro de eliminar este proveedor?");

    if (!confirmar) return;

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
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

// ==========================================
// CARGAR PROVEEDORES AL INICIAR
// ==========================================

cargarProveedores();
