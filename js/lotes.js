// ==========================================
// DIRECCIONES DE LA API
// ==========================================

const API_PRODUCTOS = "http://127.0.0.1:5001/api/productos";
const API_LOTES = "http://127.0.0.1:5001/api/lotes";



// ==========================================
// PERMISOS DEL USUARIO
// ==========================================

const usuarioLotes = JSON.parse(localStorage.getItem("usuarioActual"));
const esEmpleado = usuarioLotes && usuarioLotes.rol === "empleado";


// ==========================================
// ELEMENTOS HTML
// ==========================================

const formulario = document.getElementById("formLote");
const selectorProducto = document.getElementById("producto");
const tablaLotes = document.getElementById("tablaLotes");

// ==========================================
// ALMACENAR INFORMACIÓN
// ==========================================

let productos = [];
let lotes = [];

// ==========================================
// ESCAPAR TEXTO HTML
// ==========================================

function escaparHTML(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, function (caracter) {
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

// ==========================================
// CARGAR PRODUCTOS DESDE MYSQL
// ==========================================

async function cargarProductos() {
  try {
    const respuesta = await fetch(API_PRODUCTOS);

    if (!respuesta.ok) {
      throw new Error("No se pudieron consultar los productos.");
    }

    productos = await respuesta.json();

    selectorProducto.innerHTML = `
            <option value="">Seleccione un producto</option>
        `;

    productos.forEach(function (producto) {
      const opcion = document.createElement("option");

      // El código identifica el producto en MySQL
      opcion.value = producto.codigo;

      opcion.textContent = producto.codigo + " - " + producto.nombre;

      selectorProducto.appendChild(opcion);
    });
  } catch (error) {
    console.error("Error al cargar productos:", error);

    alert("No fue posible cargar los productos.");
  }
}

// ==========================================
// CARGAR LOTES DESDE MYSQL
// ==========================================

async function cargarLotes() {
  try {
    const respuesta = await fetch(API_LOTES);

    if (!respuesta.ok) {
      throw new Error("No se pudieron consultar los lotes.");
    }

    lotes = await respuesta.json();

    mostrarLotes();
  } catch (error) {
    console.error("Error al cargar lotes:", error);

    tablaLotes.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    No fue posible cargar los lotes.
                </td>
            </tr>
        `;
  }
}

// ==========================================
// CALCULAR ALERTA DE VENCIMIENTO
// ==========================================

function calcularAlerta(fechaVencimiento) {
  const hoy = new Date();

  hoy.setHours(0, 0, 0, 0);

  const vencimiento = new Date(fechaVencimiento + "T00:00:00");

  const diferencia = vencimiento - hoy;

  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

  if (dias < 0) {
    return {
      texto: "Vencido",
      clase: "stock-agotado",
      icono: "fa-circle-xmark",
    };
  }

  if (dias <= 30) {
    return {
      texto: "Vence en menos de 30 días",
      clase: "stock-agotado",
      icono: "fa-triangle-exclamation",
    };
  }

  if (dias <= 60) {
    return {
      texto: "Vence en menos de 60 días",
      clase: "stock-bajo",
      icono: "fa-triangle-exclamation",
    };
  }

  if (dias <= 90) {
    return {
      texto: "Vence en menos de 90 días",
      clase: "stock-bajo",
      icono: "fa-calendar-days",
    };
  }

  return {
    texto: "Vigente",
    clase: "stock-normal",
    icono: "fa-circle-check",
  };
}

// ==========================================
// FORMATEAR FECHA
// ==========================================

function formatearFecha(fecha) {
  if (!fecha) {
    return "N/A";
  }

  const partes = String(fecha).split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

// ==========================================
// MOSTRAR LOTES
// ==========================================

function mostrarLotes() {
  tablaLotes.innerHTML = "";

  if (lotes.length === 0) {
    tablaLotes.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    <i class="fa-solid fa-box-open me-2"></i>
                    No hay lotes registrados.
                </td>
            </tr>
        `;

    return;
  }

  lotes.forEach(function (lote) {
    const alerta = calcularAlerta(lote.fechaVencimiento);

    let estadoTexto = lote.estado || "Disponible";

    if (Number(lote.cantidad) <= 0) {
      estadoTexto = "Agotado";
    }

    let estadoClase = "stock-normal";
    let estadoIcono = "fa-circle-check";

    if (alerta.texto === "Vencido") {
      estadoTexto = "No Disponible";
      estadoClase = "stock-agotado";
      estadoIcono = "fa-circle-xmark";
    } else if (estadoTexto === "Bloqueado") {
      estadoClase = "stock-bajo";
      estadoIcono = "fa-lock";
    } else if (estadoTexto === "Agotado") {
      estadoClase = "stock-agotado";
      estadoIcono = "fa-circle-xmark";
    }

    const fila = document.createElement("tr");

    fila.innerHTML = `
            <td>
                <span class="codigo-producto">
                    ${escaparHTML(lote.productoCodigo || "N/A")}
                </span>
            </td>

            <td>
                <span class="nombre-producto">
                    <i class="fa-solid fa-box producto-mini-icon"></i>
                    ${escaparHTML(lote.producto || "N/A")}
                </span>
            </td>

            <td>
                <strong>
                    ${escaparHTML(lote.numeroLote)}
                </strong>
            </td>

            <td>
                ${formatearFecha(lote.fechaFabricacion)}
            </td>

            <td>
                ${formatearFecha(lote.fechaVencimiento)}
            </td>

            <td>
                <strong class="stock-numero">
                    ${Number(lote.cantidad) || 0}
                </strong>
            </td>

            <td>
                <span class="stock-badge ${estadoClase}">
                    <i class="fa-solid ${estadoIcono}"></i>
                    ${estadoTexto}
                </span>
            </td>

            <td>
                <span class="stock-badge ${alerta.clase}">
                    <i class="fa-solid ${alerta.icono}"></i>
                    ${alerta.texto}
                </span>
            </td>

            <td>
    ${
        esEmpleado
            ? '<span class="text-muted">Solo consulta</span>'
            : `
                <button
                    class="btn btn-accion btn-eliminar"
                    onclick="eliminarLote(${Number(lote.id)})"
                    title="Eliminar lote"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>
            `
    }
</td>
        `;

    tablaLotes.appendChild(fila);
  });
}

// ==========================================
// REGISTRAR LOTE EN MYSQL
// ==========================================

formulario.addEventListener("submit", async function (event) {
  event.preventDefault();

  const productoCodigo = selectorProducto.value;

  const numeroLote = document.getElementById("numeroLote").value.trim();

  const fechaFabricacion = document.getElementById("fechaFabricacion").value;

  const fechaVencimiento = document.getElementById("fechaVencimiento").value;

  const cantidad = Number(document.getElementById("cantidad").value);

  const estado = document.getElementById("estado").value;

  // VALIDAR PRODUCTO

  if (productoCodigo === "") {
    alert("Seleccione un producto.");
    return;
  }

  // VALIDAR NÚMERO DE LOTE

  if (numeroLote === "") {
    alert("Ingrese el número de lote.");
    return;
  }

  // VALIDAR CANTIDAD

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    alert("La cantidad debe ser un número entero mayor que cero.");
    return;
  }

  // VALIDAR FECHAS

  if (fechaFabricacion === "" || fechaVencimiento === "") {
    alert("Ingrese las fechas de fabricación y vencimiento.");
    return;
  }

  if (fechaVencimiento <= fechaFabricacion) {
    alert(
      "La fecha de vencimiento debe ser posterior a la fecha de fabricación.",
    );
    return;
  }

  // VALIDAR LOTE REPETIDO

  const loteRepetido = lotes.some(function (lote) {
    return String(lote.numeroLote).toLowerCase() === numeroLote.toLowerCase();
  });

  if (loteRepetido) {
    alert("Ya existe un lote con ese número.");
    return;
  }

  // PREPARAR INFORMACIÓN

  const nuevoLote = {
    productoCodigo: productoCodigo,
    numeroLote: numeroLote,
    fechaFabricacion: fechaFabricacion,
    fechaVencimiento: fechaVencimiento,
    cantidad: cantidad,
    estado: estado,
  };

  try {
    const respuesta = await fetch(API_LOTES, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nuevoLote),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo registrar el lote.");
    }

    formulario.reset();

    await cargarLotes();

    alert("Lote registrado correctamente.");
  } catch (error) {
    console.error("Error al registrar lote:", error);

    alert(error.message);
  }
});

// ==========================================
// ELIMINAR LOTE DE MYSQL
// ==========================================

async function eliminarLote(id) {

    if (esEmpleado) {
        alert("No tienes permisos para eliminar lotes.");
        return;
    }
  const confirmar = confirm("¿Está seguro de eliminar este lote?");

  if (!confirmar) {
    return;
  }

  try {
    const respuesta = await fetch(`${API_LOTES}/${id}`, {
      method: "DELETE",
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo eliminar el lote.");
    }

    await cargarLotes();

    alert("Lote eliminado correctamente.");
  } catch (error) {
    console.error("Error al eliminar lote:", error);

    alert(error.message);
  }
}

// ==========================================
// INICIAR PÁGINA
// ==========================================

async function iniciarPagina() {
  await cargarProductos();
  await cargarLotes();
}

iniciarPagina();
