const API_PRODUCTOS = "http://127.0.0.1:5001/api/productos";
const API_LOTES = "http://127.0.0.1:5001/api/lotes";
const API_MOVIMIENTOS = "http://127.0.0.1:5001/api/movimientos-inventario";

let productos = [];
let lotes = [];
let movimientos = [];

const formInventario = document.getElementById("formInventario");
const selectProducto = document.getElementById("producto");
const selectLote = document.getElementById("lote");
const selectTipo = document.getElementById("tipoMovimiento");
const inputCantidad = document.getElementById("cantidad");

const tablaInventario = document.getElementById("tablaInventario");
const tablaMovimientos = document.getElementById("tablaMovimientos");

// ==========================================
// CARGAR DATOS DESDE MYSQL
// ==========================================

async function cargarDatos() {
  try {
    const [respuestaProductos, respuestaLotes, respuestaMovimientos] =
      await Promise.all([
        fetch(API_PRODUCTOS),
        fetch(API_LOTES),
        fetch(API_MOVIMIENTOS),
      ]);

    if (
      !respuestaProductos.ok ||
      !respuestaLotes.ok ||
      !respuestaMovimientos.ok
    ) {
      throw new Error("No se pudieron consultar todos los datos.");
    }

    productos = await respuestaProductos.json();
    lotes = await respuestaLotes.json();
    movimientos = await respuestaMovimientos.json();

    cargarProductos();
    cargarLotes();
    mostrarInventario();
    mostrarMovimientos();
  } catch (error) {
    console.error("Error al cargar inventario:", error);
    alert("No fue posible cargar los datos del inventario.");
  }
}

// ==========================================
// CARGAR SELECTOR DE PRODUCTOS
// ==========================================

function cargarProductos() {
  selectProducto.innerHTML = '<option value="">Seleccione un producto</option>';

  productos.forEach((producto) => {
    const opcion = document.createElement("option");

    opcion.value = producto.codigo;
    opcion.textContent = `${producto.nombre} (${producto.codigo})`;

    selectProducto.appendChild(opcion);
  });
}

// ==========================================
// CARGAR LOTES DEL PRODUCTO SELECCIONADO
// ==========================================

function cargarLotes() {
  const codigoProducto = selectProducto.value;

  selectLote.innerHTML = '<option value="">Seleccione un lote</option>';

  if (!codigoProducto) {
    return;
  }

  const lotesProducto = lotes.filter(
    (lote) => lote.productoCodigo === codigoProducto,
  );

  lotesProducto.forEach((lote) => {
    const opcion = document.createElement("option");

    opcion.value = lote.id;
    opcion.textContent = `${lote.numeroLote} - Cantidad: ${lote.cantidad}`;

    selectLote.appendChild(opcion);
  });
}

// ==========================================
// CALCULAR EXISTENCIAS POR LOTES
// ==========================================

function calcularStockPorLotes(codigoProducto) {
  return lotes
    .filter((lote) => lote.productoCodigo === codigoProducto)
    .reduce((total, lote) => total + Number(lote.cantidad), 0);
}

// ==========================================
// MOSTRAR INVENTARIO ACTUAL
// ==========================================

function mostrarInventario() {
  tablaInventario.innerHTML = "";

  productos.forEach((producto) => {
    const stock = calcularStockPorLotes(producto.codigo);
    const stockMinimo = Number(producto.stockMinimo);

    let estado = "";
    let claseEstado = "";

    if (stock === 0) {
      estado = "Agotado";
      claseEstado = "danger";
    } else if (stock <= stockMinimo) {
      estado = "Stock bajo";
      claseEstado = "warning";
    } else {
      estado = "Disponible";
      claseEstado = "success";
    }

    const fila = document.createElement("tr");

    fila.innerHTML = `
            <td>${producto.codigo}</td>
            <td>${producto.nombre}</td>
            <td>${producto.categoria}</td>
            <td>${stock}</td>
            <td>${stockMinimo}</td>
            <td>
                <span class="badge bg-${claseEstado}">
                    ${estado}
                </span>
            </td>
        `;

    tablaInventario.appendChild(fila);
  });
}

// ==========================================
// OBTENER FECHA DEL MOVIMIENTO
// ==========================================

function obtenerFechaMovimiento(fechaTexto) {

    const fecha = String(fechaTexto || "");

    // Formato recibido: DD/MM/AAAA HH:mm
    const partes = fecha.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/
    );

    if (partes) {
        return new Date(
            Number(partes[3]),
            Number(partes[2]) - 1,
            Number(partes[1]),
            Number(partes[4] || 0),
            Number(partes[5] || 0)
        );
    }

    // Intentar interpretar otros formatos de fecha
    const fechaConvertida = new Date(fecha);

    if (isNaN(fechaConvertida.getTime())) {
        return null;
    }

    return fechaConvertida;
}


// ==========================================
// MOSTRAR HISTORIAL AGRUPADO POR MES
// ==========================================

function mostrarMovimientos() {

    tablaMovimientos.innerHTML = "";

    if (movimientos.length === 0) {

        tablaMovimientos.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    No hay movimientos registrados.
                </td>
            </tr>
        `;

        return;
    }

    // Agrupar movimientos por mes y año
    const grupos = new Map();

    movimientos.forEach((movimiento) => {

        const fecha = obtenerFechaMovimiento(movimiento.fecha);

        let clave;
        let nombreMes;

        if (fecha) {

            const anio = fecha.getFullYear();
            const mes = String(fecha.getMonth() + 1).padStart(2, "0");

            clave = `${anio}-${mes}`;

            nombreMes = new Intl.DateTimeFormat("es-CO", {
                month: "long",
                year: "numeric"
            }).format(fecha);

            nombreMes =
                nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

        } else {

            clave = "sin-fecha";
            nombreMes = "Fecha no disponible";

        }

        if (!grupos.has(clave)) {
            grupos.set(clave, {
                nombre: nombreMes,
                movimientos: []
            });
        }

        grupos.get(clave).movimientos.push(movimiento);

    });

    // Mostrar cada grupo mensual
    grupos.forEach((grupo) => {

        // Encabezado del mes
        const filaMes = document.createElement("tr");

        filaMes.innerHTML = `
            <td colspan="5" class="table-secondary fw-bold">
                <i class="fa-solid fa-calendar-days me-2"></i>
                ${grupo.nombre}
            </td>
        `;

        tablaMovimientos.appendChild(filaMes);

        // Movimientos correspondientes al mes
        grupo.movimientos.forEach((movimiento) => {

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${movimiento.fecha || ""}</td>
                <td>${movimiento.producto || movimiento.productoCodigo}</td>
                <td>${movimiento.lote || "Sin lote"}</td>
                <td>${movimiento.tipo}</td>
                <td>${movimiento.cantidad}</td>
            `;

            tablaMovimientos.appendChild(fila);

        });

    });

}


// ==========================================
// ABRIR Y CERRAR HISTORIAL
// ==========================================

const botonHistorial = document.getElementById("botonHistorial");
const contenedorHistorial = document.getElementById("contenedorHistorial");

botonHistorial.addEventListener("click", function () {

    const estaOculto = contenedorHistorial.style.display === "none";

    if (estaOculto) {

        contenedorHistorial.style.display = "block";

        botonHistorial.innerHTML = `
            <i class="fa-solid fa-eye-slash me-2"></i>
            Ocultar historial de movimientos
        `;

    } else {

        contenedorHistorial.style.display = "none";

        botonHistorial.innerHTML = `
            <i class="fa-solid fa-clock-rotate-left me-2"></i>
            Ver historial de movimientos
        `;

    }

});

// ==========================================
// ACTUALIZAR LOTES AL CAMBIAR PRODUCTO
// ==========================================

selectProducto.addEventListener("change", cargarLotes);

// ==========================================
// REGISTRAR ENTRADA O SALIDA
// ==========================================

formInventario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const productoCodigo = selectProducto.value;
  const loteId = selectLote.value;
  const tipo = selectTipo.value;
  const cantidad = Number(inputCantidad.value);

  if (
    !productoCodigo ||
    !loteId ||
    !tipo ||
    !Number.isInteger(cantidad) ||
    cantidad <= 0
  ) {
    alert("Por favor, complete todos los campos correctamente.");
    return;
  }

  const datos = {
    productoCodigo: productoCodigo,
    loteId: Number(loteId),
    tipo: tipo,
    cantidad: cantidad,
    usuarioId: null,
    observacion: null,
  };

  try {
    const respuesta = await fetch(API_MOVIMIENTOS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert(resultado.error || "No se pudo registrar el movimiento.");
      return;
    }

    alert(resultado.mensaje);

    formInventario.reset();

    await cargarDatos();
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    alert("No fue posible comunicarse con el servidor.");
  }
});

// ==========================================
// INICIAR MÓDULO
// ==========================================

cargarDatos();
