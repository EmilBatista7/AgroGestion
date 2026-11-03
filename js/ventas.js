// ==========================================
// CONFIGURACIÓN DE LA API
// ==========================================

const API = "http://127.0.0.1:5001/api";

// ==========================================
// DATOS
// ==========================================

let productos = [];
let clientes = [];
let lotes = [];
let ventas = [];
let carrito = [];

// ==========================================
// ELEMENTOS HTML
// ==========================================

const selectorCliente = document.getElementById("cliente");
const selectorProducto = document.getElementById("producto");
const selectorLote = document.getElementById("lote");
const inputCantidad = document.getElementById("cantidad");

const botonAgregar = document.getElementById("botonAgregar");
const botonRegistrarVenta = document.getElementById("botonRegistrarVenta");

const tablaCarrito = document.getElementById("tablaCarrito");
const tablaVentas = document.getElementById("tablaVentas");
const elementoTotal = document.getElementById("total");

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function formatoMoneda(valor) {
  return Number(valor || 0).toLocaleString("es-CO");
}

function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, function (caracter) {
    const caracteres = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return caracteres[caracter];
  });
}

async function consultarAPI(ruta, opciones = {}) {
  const respuesta = await fetch(API + ruta, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      ...(opciones.headers || {}),
    },
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || "Ocurrió un error en el servidor.");
  }

  return datos;
}

// ==========================================
// CARGAR CLIENTES DESDE MYSQL
// ==========================================

async function cargarClientes() {
  try {
    clientes = await consultarAPI("/clientes");

    selectorCliente.innerHTML = `
            <option value="">Seleccione un cliente</option>
        `;

    clientes.forEach(function (cliente) {
      if (cliente.estado === "Activo") {
        const opcion = document.createElement("option");

        opcion.value = cliente.id;

        opcion.textContent = cliente.documento + " - " + cliente.nombre;

        selectorCliente.appendChild(opcion);
      }
    });
  } catch (error) {
    console.error("Error al cargar clientes:", error);
    alert("No se pudieron cargar los clientes: " + error.message);
  }
}

// ==========================================
// CARGAR PRODUCTOS DESDE MYSQL
// ==========================================

async function cargarProductos() {
  try {
    productos = await consultarAPI("/productos");

    selectorProducto.innerHTML = `
            <option value="">Seleccione un producto</option>
        `;

    productos.forEach(function (producto) {
      if (producto.estado === "Activo" && Number(producto.stock) > 0) {
        const opcion = document.createElement("option");

        opcion.value = producto.codigo;

        opcion.textContent =
          producto.codigo +
          " - " +
          producto.nombre +
          " - $" +
          formatoMoneda(producto.precio);

        selectorProducto.appendChild(opcion);
      }
    });
  } catch (error) {
    console.error("Error al cargar productos:", error);
    alert("No se pudieron cargar los productos: " + error.message);
  }
}

// ==========================================
// CARGAR LOTES DESDE MYSQL
// ==========================================

async function cargarLotes() {
  try {
    lotes = await consultarAPI("/lotes");

    selectorLote.innerHTML = `
            <option value="">Seleccione un lote</option>
        `;

    const codigoProducto = selectorProducto.value;

    if (!codigoProducto) {
      return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    lotes.forEach(function (lote) {
      const fechaVencimiento = new Date(lote.fechaVencimiento + "T00:00:00");

      const mismoProducto = lote.productoCodigo === codigoProducto;

      const disponible = lote.estado === "Disponible";

      const tieneCantidad = Number(lote.cantidad) > 0;

      const noVencido = fechaVencimiento >= hoy;

      if (mismoProducto && disponible && tieneCantidad && noVencido) {
        const opcion = document.createElement("option");

        opcion.value = lote.id;

        opcion.textContent =
          lote.numeroLote + " - Disponible: " + lote.cantidad;

        selectorLote.appendChild(opcion);
      }
    });
  } catch (error) {
    console.error("Error al cargar lotes:", error);
    alert("No se pudieron cargar los lotes: " + error.message);
  }
}

// ==========================================
// CUANDO CAMBIA EL PRODUCTO
// ==========================================

selectorProducto.addEventListener("change", function () {
  cargarLotes();
});

// ==========================================
// MOSTRAR CARRITO
// ==========================================

function mostrarCarrito() {
  tablaCarrito.innerHTML = "";

  let total = 0;

  carrito.forEach(function (item, indice) {
    const subtotal = Number(item.precio) * Number(item.cantidad);

    total += subtotal;

    const fila = document.createElement("tr");

    fila.innerHTML = `
            <td>
                <span class="nombre-producto">
                    <i class="fa-solid fa-box producto-mini-icon"></i>
                    ${escaparHTML(item.nombre)}
                </span>
            </td>

            <td>
                $${formatoMoneda(item.precio)}
            </td>

            <td>
                ${item.cantidad}
            </td>

            <td>
                <strong>$${formatoMoneda(subtotal)}</strong>
            </td>

            <td>
                <button
                    class="btn btn-accion btn-eliminar"
                    onclick="eliminarDelCarrito(${indice})"
                    title="Eliminar producto"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;

    tablaCarrito.appendChild(fila);
  });

  elementoTotal.textContent = formatoMoneda(total);
}

// ==========================================
// AGREGAR PRODUCTO AL CARRITO
// ==========================================

botonAgregar.addEventListener("click", function () {
  const codigoProducto = selectorProducto.value;

  const loteId = Number(selectorLote.value);

  const cantidad = Number(inputCantidad.value);

  if (!codigoProducto) {
    alert("Seleccione un producto.");
    return;
  }

  if (!loteId) {
    alert("Seleccione un lote.");
    return;
  }

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    alert("La cantidad debe ser un número entero mayor que cero.");
    return;
  }

  const producto = productos.find(function (item) {
    return item.codigo === codigoProducto;
  });

  const lote = lotes.find(function (item) {
    return Number(item.id) === loteId;
  });

  if (!producto || !lote) {
    alert("No se encontró el producto o el lote.");
    return;
  }

  if (cantidad > Number(lote.cantidad)) {
    alert("La cantidad supera la disponibilidad del lote.");
    return;
  }

  const productoExistente = carrito.find(function (item) {
    return item.productoCodigo === codigoProducto && item.loteId === loteId;
  });

  if (productoExistente) {
    const nuevaCantidad = Number(productoExistente.cantidad) + cantidad;

    if (nuevaCantidad > Number(lote.cantidad)) {
      alert("La cantidad supera la disponibilidad del lote.");
      return;
    }

    productoExistente.cantidad = nuevaCantidad;
  } else {
    carrito.push({
      productoCodigo: producto.codigo,
      loteId: lote.id,
      nombre: producto.nombre,
      numeroLote: lote.numeroLote,
      precio: Number(producto.precio),
      cantidad: cantidad,
    });
  }

  selectorProducto.value = "";

  selectorLote.innerHTML = `
        <option value="">Seleccione un lote</option>
    `;

  inputCantidad.value = 1;

  mostrarCarrito();
});

// ==========================================
// ELIMINAR DEL CARRITO
// ==========================================

function eliminarDelCarrito(indice) {
  carrito.splice(indice, 1);

  mostrarCarrito();
}

// ==========================================
// REGISTRAR VENTA EN MYSQL
// ==========================================

botonRegistrarVenta.addEventListener("click", async function () {
  const clienteId = Number(selectorCliente.value);

  const metodoPago = document.getElementById("metodoPago").value;

  if (!clienteId) {
    alert("Seleccione un cliente.");
    return;
  }

  if (!metodoPago) {
    alert("Seleccione un método de pago.");
    return;
  }

  if (carrito.length === 0) {
    alert("Debe agregar al menos un producto.");
    return;
  }

  const datosVenta = {
    clienteId: clienteId,
    metodoPago: metodoPago,
    usuarioId: null,

    productos: carrito.map(function (item) {
      return {
        productoCodigo: item.productoCodigo,
        loteId: item.loteId,
        cantidad: item.cantidad,
      };
    }),
  };

  botonRegistrarVenta.disabled = true;

  try {
    const resultado = await consultarAPI("/ventas", {
      method: "POST",
      body: JSON.stringify(datosVenta),
    });

    alert(
      "Venta registrada correctamente.\n\n" +
        "Número de venta: " +
        resultado.ventaId +
        "\n" +
        "Total: $" +
        formatoMoneda(resultado.total),
    );

    // Vaciar carrito
    carrito = [];

    // Limpiar campos
    selectorCliente.value = "";

    document.getElementById("metodoPago").value = "";

    selectorProducto.value = "";

    selectorLote.innerHTML = `
            <option value="">Seleccione un lote</option>
        `;

    inputCantidad.value = 1;

    mostrarCarrito();

    // Actualizar información desde MySQL
    await cargarProductos();
    await cargarLotes();
    await mostrarVentas();
  } catch (error) {
    console.error("Error al registrar venta:", error);

    alert("No se pudo registrar la venta:\n" + error.message);
  } finally {
    botonRegistrarVenta.disabled = false;
  }
});

// ==========================================
// CONSULTAR HISTORIAL DE VENTAS
// ==========================================

async function mostrarVentas() {
  tablaVentas.innerHTML = "";

  try {
    ventas = await consultarAPI("/ventas");

    if (ventas.length === 0) {
      tablaVentas.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="fa-solid fa-receipt me-2"></i>
                        No hay ventas registradas.
                    </td>
                </tr>
            `;

      return;
    }

    ventas.forEach(function (venta) {
      const fila = document.createElement("tr");

      fila.innerHTML = `
                <td>${escaparHTML(venta.fecha)}</td>

                <td>${escaparHTML(venta.cliente)}</td>

                <td>
                    <strong>
                        $${formatoMoneda(venta.total)}
                    </strong>
                </td>

                <td>${escaparHTML(venta.metodoPago || "")}</td>

                <td>${escaparHTML(venta.estado || "")}</td>

                <td>
                    <button
                        class="btn btn-accion btn-agro"
                        onclick="verDetalleVenta(${venta.id})"
                        title="Ver detalle de la venta"
                    >
                        <i class="fa-solid fa-eye"></i>
                    </button>

                    <button
                        class="btn btn-accion btn-agro"
                        onclick="registrarDevolucion(${venta.id})"
                        title="Registrar devolución"
                        ${venta.estado === "Devuelta" ? "disabled" : ""}
                    >
                        <i class="fa-solid fa-rotate-left"></i>
                    </button>
                </td>
            `;

      tablaVentas.appendChild(fila);
    });
  } catch (error) {
    console.error("Error al consultar ventas:", error);

    tablaVentas.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    No se pudo cargar el historial de ventas.
                </td>
            </tr>
        `;
  }
}

// ==========================================
// VER DETALLE DE UNA VENTA
// ==========================================

async function verDetalleVenta(ventaId) {
  try {
    const venta = await consultarAPI("/ventas/" + ventaId);

    let detalle = "";

    detalle += "DETALLE DE LA VENTA\n\n";

    detalle += "Número: " + venta.id + "\n";

    detalle += "Fecha: " + venta.fecha + "\n";

    detalle += "Cliente: " + venta.cliente + "\n";

    detalle += "Método de pago: " + venta.metodoPago + "\n";

    detalle += "Estado: " + venta.estado + "\n\n";

    detalle += "PRODUCTOS:\n";

    venta.productos.forEach(function (item) {
      detalle +=
        "- " +
        item.producto +
        " | Lote: " +
        (item.numeroLote || "Sin lote") +
        " | Vendido: " +
        item.cantidad +
        " | Devuelto: " +
        item.cantidadDevuelta +
        " | Precio: $" +
        formatoMoneda(item.precio) +
        "\n";
    });

    detalle += "\nTotal: $" + formatoMoneda(venta.total);

    alert(detalle);
  } catch (error) {
    console.error("Error al consultar detalle:", error);

    alert("No se pudo consultar el detalle:\n" + error.message);
  }
}

// ==========================================
// REGISTRAR DEVOLUCIÓN EN MYSQL
// ==========================================

async function registrarDevolucion(ventaId) {
  try {
    const venta = await consultarAPI("/ventas/" + ventaId);

    if (!venta.productos || venta.productos.length === 0) {
      alert("Esta venta no tiene productos.");
      return;
    }

    const productosDisponibles = venta.productos.filter(function (item) {
      return Number(item.cantidad) - Number(item.cantidadDevuelta) > 0;
    });

    if (productosDisponibles.length === 0) {
      alert("Todos los productos de esta venta ya fueron devueltos.");
      return;
    }

    let mensaje = "PRODUCTOS DE LA VENTA:\n\n";

    venta.productos.forEach(function (item, indice) {
      const disponible = Number(item.cantidad) - Number(item.cantidadDevuelta);

      mensaje +=
        indice +
        1 +
        ". " +
        item.producto +
        " | Lote: " +
        (item.numeroLote || "Sin lote") +
        " | Vendido: " +
        item.cantidad +
        " | Devuelto: " +
        item.cantidadDevuelta +
        " | Disponible para devolver: " +
        disponible +
        "\n";
    });

    const seleccion = prompt(
      mensaje + "\nEscribe el número del producto que deseas devolver:",
    );

    if (seleccion === null) {
      return;
    }

    if (!/^\d+$/.test(seleccion)) {
      alert("Debes escribir un número válido.");
      return;
    }

    const indiceProducto = Number(seleccion) - 1;

    if (indiceProducto < 0 || indiceProducto >= venta.productos.length) {
      alert("Producto seleccionado no válido.");
      return;
    }

    const item = venta.productos[indiceProducto];

    const disponible = Number(item.cantidad) - Number(item.cantidadDevuelta);

    if (disponible <= 0) {
      alert("Este producto ya fue devuelto completamente.");
      return;
    }

    const respuestaCantidad = prompt(
      "Cantidad a devolver de " +
        item.producto +
        ":\n\nMáximo permitido: " +
        disponible,
    );

    if (respuestaCantidad === null) {
      return;
    }

    if (!/^\d+$/.test(respuestaCantidad)) {
      alert("La cantidad debe ser un número entero válido.");
      return;
    }

    const cantidad = Number(respuestaCantidad);

    if (cantidad <= 0 || cantidad > disponible) {
      alert("La cantidad supera las unidades que se pueden devolver.");
      return;
    }

    const confirmar = confirm(
      "¿Deseas registrar esta devolución?\n\n" +
        "Producto: " +
        item.producto +
        "\n" +
        "Cantidad: " +
        cantidad +
        "\n" +
        "Valor a devolver: $" +
        formatoMoneda(Number(item.precio) * cantidad),
    );

    if (!confirmar) {
      return;
    }

    const resultado = await consultarAPI(
      "/ventas/" + ventaId + "/devoluciones",
      {
        method: "POST",
        body: JSON.stringify({
          detalleId: item.id,
          cantidad: cantidad,
        }),
      },
    );

    alert(
      resultado.mensaje +
        "\n\nCantidad devuelta: " +
        resultado.cantidadDevuelta +
        "\nValor devuelto: $" +
        formatoMoneda(resultado.valorDevuelto),
    );

    // Actualizar información desde MySQL
    await cargarProductos();
    await cargarLotes();
    await mostrarVentas();
  } catch (error) {
    console.error("Error al registrar devolución:", error);

    alert("No se pudo registrar la devolución:\n" + error.message);
  }
}

// ==========================================
// INICIAR MÓDULO DE VENTAS
// ==========================================

async function iniciarVentas() {
  await cargarClientes();

  await cargarProductos();

  await cargarLotes();

  mostrarCarrito();

  await mostrarVentas();
}

iniciarVentas();
