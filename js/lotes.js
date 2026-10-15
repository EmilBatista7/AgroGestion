// ==========================================
// OBTENER INFORMACIÓN DE LOCALSTORAGE
// ==========================================

let productos = JSON.parse(localStorage.getItem("productos")) || [];

let lotes = JSON.parse(localStorage.getItem("lotes")) || [];

// ==========================================
// ELEMENTOS HTML
// ==========================================

const formulario = document.getElementById("formLote");

const selectorProducto = document.getElementById("producto");

const tablaLotes = document.getElementById("tablaLotes");

// ==========================================
// CARGAR PRODUCTOS
// ==========================================

function cargarProductos() {
  selectorProducto.innerHTML = `
        <option value="">
            Seleccione un producto
        </option>
    `;

  productos.forEach(function (producto, indice) {
    const opcion = document.createElement("option");

    opcion.value = indice;

    opcion.textContent = producto.codigo + " - " + producto.nombre;

    selectorProducto.appendChild(opcion);
  });
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

  // VENCIDO

  if (dias < 0) {
    return {
      texto: "Vencido",
      clase: "stock-agotado",
      icono: "fa-circle-xmark",
    };
  }

  // MENOS DE 30 DÍAS

  if (dias <= 30) {
    return {
      texto: "Vence en menos de 30 días",
      clase: "stock-agotado",
      icono: "fa-triangle-exclamation",
    };
  }

  // MENOS DE 60 DÍAS

  if (dias <= 60) {
    return {
      texto: "Vence en menos de 60 días",
      clase: "stock-bajo",
      icono: "fa-triangle-exclamation",
    };
  }

  // MENOS DE 90 DÍAS

  if (dias <= 90) {
    return {
      texto: "Vence en menos de 90 días",
      clase: "stock-bajo",
      icono: "fa-calendar-days",
    };
  }

  // VIGENTE

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

  const partes = fecha.split("-");

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

  // ==========================================
  // NO HAY LOTES
  // ==========================================

  if (lotes.length === 0) {
    tablaLotes.innerHTML = `
            <tr>

                <td
                    colspan="9"
                    class="text-center py-4"
                >

                    <i class="fa-solid fa-box-open me-2"></i>

                    No hay lotes registrados.

                </td>

            </tr>
        `;

    return;
  }

  // ==========================================
  // RECORRER LOTES
  // ==========================================

  lotes.forEach(function (lote, indice) {
    // Calcular alerta

    const alerta = calcularAlerta(lote.fechaVencimiento);

    // ==========================================
    // ESTADO DEL LOTE
    // ==========================================

    let estadoTexto = lote.estado || "Disponible";

    // Si el lote no tiene unidades
if (Number(lote.cantidad) <= 0) {
  estadoTexto = "Agotado";
}

    let estadoClase = "stock-normal";

    let estadoIcono = "fa-circle-check";

    // Si está vencido

    if (alerta.texto === "Vencido") {
      estadoTexto = "No Disponible";

      estadoClase = "stock-agotado";

      estadoIcono = "fa-circle-xmark";
    }

    // Si está bloqueado
    else if (estadoTexto === "Bloqueado") {
      estadoClase = "stock-bajo";

      estadoIcono = "fa-lock";
    }

    // Si está agotado
    else if (estadoTexto === "Agotado") {
      estadoClase = "stock-agotado";

      estadoIcono = "fa-circle-xmark";
    }

    // ==========================================
    // CREAR FILA
    // ==========================================

    const fila = document.createElement("tr");

    fila.innerHTML = `

            <td>

                <span class="codigo-producto">

                    ${lote.productoCodigo || "N/A"}

                </span>

            </td>


            <td>

                <span class="nombre-producto">

                    <i class="fa-solid fa-box producto-mini-icon"></i>

                    ${lote.producto || "N/A"}

                </span>

            </td>


            <td>

                <strong>

                    ${lote.numeroLote}

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

                <button
                    class="btn btn-accion btn-eliminar"
                    onclick="eliminarLote(${indice})"
                    title="Eliminar lote"
                >

                    <i class="fa-solid fa-trash"></i>

                </button>

            </td>

        `;

    tablaLotes.appendChild(fila);
  });
}

// ==========================================
// REGISTRAR LOTE
// ==========================================

formulario.addEventListener("submit", function (event) {
  event.preventDefault();

  // ==========================================
  // OBTENER DATOS
  // ==========================================

  const indiceProducto = selectorProducto.value;

  const numeroLote = document.getElementById("numeroLote").value.trim();

  const fechaFabricacion = document.getElementById("fechaFabricacion").value;

  const fechaVencimiento = document.getElementById("fechaVencimiento").value;

  const cantidad = Number(document.getElementById("cantidad").value);

  const estado = document.getElementById("estado").value;

  // ==========================================
  // VALIDAR PRODUCTO
  // ==========================================

  if (indiceProducto === "") {
    alert("Seleccione un producto.");

    return;
  }

  // ==========================================
  // VALIDAR NÚMERO DE LOTE
  // ==========================================

  if (numeroLote === "") {
    alert("Ingrese el número de lote.");

    return;
  }

  // ==========================================
  // VALIDAR CANTIDAD
  // ==========================================

  if (cantidad <= 0 || isNaN(cantidad)) {
    alert("La cantidad debe ser mayor que cero.");

    return;
  }

  // ==========================================
  // VALIDAR FECHAS
  // ==========================================

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

  // ==========================================
  // VALIDAR LOTE REPETIDO
  // ==========================================

  const loteRepetido = lotes.some(function (lote) {
    return String(lote.numeroLote).toLowerCase() === numeroLote.toLowerCase();
  });

  if (loteRepetido) {
    alert("Ya existe un lote con ese número.");

    return;
  }

  // ==========================================
  // OBTENER PRODUCTO
  // ==========================================

  const producto = productos[indiceProducto];

  // ==========================================
  // CREAR NUEVO LOTE
  // ==========================================

  const nuevoLote = {
    productoCodigo: producto.codigo,

    producto: producto.nombre,

    numeroLote: numeroLote,

    fechaFabricacion: fechaFabricacion,

    fechaVencimiento: fechaVencimiento,

    cantidad: cantidad,

    estado: estado,
  };

  // ==========================================
  // GUARDAR LOTE
  // ==========================================

  lotes.push(nuevoLote);

  localStorage.setItem("lotes", JSON.stringify(lotes));

  // ==========================================
  // LIMPIAR FORMULARIO
  // ==========================================

  formulario.reset();

  // ==========================================
  // ACTUALIZAR TABLA
  // ==========================================

  mostrarLotes();

  // ==========================================
  // MENSAJE
  // ==========================================

  alert("Lote registrado correctamente.");
});

// ==========================================
// ELIMINAR LOTE
// ==========================================

function eliminarLote(indice) {
  const confirmar = confirm("¿Está seguro de eliminar este lote?");

  if (!confirmar) {
    return;
  }

  lotes.splice(indice, 1);

  localStorage.setItem("lotes", JSON.stringify(lotes));

  mostrarLotes();

  alert("Lote eliminado correctamente.");
}

// ==========================================
// INICIAR PÁGINA
// ==========================================

cargarProductos();

mostrarLotes();
