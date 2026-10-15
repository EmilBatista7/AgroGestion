// ==========================================
// DATOS GUARDADOS
// ==========================================

let productos = JSON.parse(localStorage.getItem("productos")) || [];

let clientes = JSON.parse(localStorage.getItem("clientes")) || [];

let ventas = JSON.parse(localStorage.getItem("ventas")) || [];

let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];

let lotes = JSON.parse(localStorage.getItem("lotes")) || [];

let movimientosCaja = JSON.parse(localStorage.getItem("movimientosCaja")) || [];

// ==========================================
// CARRITO
// ==========================================

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
// CARGAR CLIENTES
// ==========================================

function cargarClientes() {
  selectorCliente.innerHTML = `
        <option value="">
            Seleccione un cliente
        </option>
    `;

  clientes.forEach(function (cliente, indice) {
    const opcion = document.createElement("option");

    opcion.value = indice;

    opcion.textContent = cliente.documento + " - " + cliente.nombre;

    selectorCliente.appendChild(opcion);
  });
}

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
    if (producto.estado === "Activo" && Number(producto.stock) > 0) {
      const opcion = document.createElement("option");

      opcion.value = indice;

      opcion.textContent =
        producto.codigo +
        " - " +
        producto.nombre +
        " - $" +
        Number(producto.precio).toLocaleString("es-CO");

      selectorProducto.appendChild(opcion);
    }
  });
}

// ==========================================
// CARGAR LOTES DEL PRODUCTO
// ==========================================

function cargarLotes() {
  // Actualizar lotes desde LocalStorage

  lotes = JSON.parse(localStorage.getItem("lotes")) || [];

  selectorLote.innerHTML = `
        <option value="">
            Seleccione un lote
        </option>
    `;

  const indiceProducto = selectorProducto.value;

  if (indiceProducto === "") {
    return;
  }

  const producto = productos[indiceProducto];

  if (!producto) {
    return;
  }

  lotes.forEach(function (lote, indice) {
    const cantidadLote = Number(lote.cantidad) || 0;

    // Verificar que pertenece al producto

    const mismoProducto = lote.productoCodigo === producto.codigo;

    // Verificar estado

    const disponible = lote.estado === "Disponible";

    // Verificar cantidad

    const tieneCantidad = cantidadLote > 0;

    // Verificar vencimiento

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    const vencimiento = new Date(lote.fechaVencimiento + "T00:00:00");

    const noVencido = vencimiento >= hoy;

    if (mismoProducto && disponible && tieneCantidad && noVencido) {
      const opcion = document.createElement("option");

      opcion.value = indice;

      opcion.textContent = lote.numeroLote + " - Disponible: " + cantidadLote;

      selectorLote.appendChild(opcion);
    }
  });
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

    total = total + subtotal;

    const fila = document.createElement("tr");

    fila.innerHTML = `

            <td>

                <span class="nombre-producto">

                    <i class="fa-solid fa-box producto-mini-icon"></i>

                    ${item.nombre}

                </span>

            </td>


            <td>

                $${Number(item.precio).toLocaleString("es-CO")}

            </td>


            <td>

                ${item.cantidad}

            </td>


            <td>

                <strong>

                    $${subtotal.toLocaleString("es-CO")}

                </strong>

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

  elementoTotal.textContent = total.toLocaleString("es-CO");
}

// ==========================================
// AGREGAR PRODUCTO
// ==========================================

botonAgregar.addEventListener("click", function () {
  const indiceProducto = selectorProducto.value;

  const indiceLote = selectorLote.value;

  const cantidad = Number(inputCantidad.value);

  // ==================================
  // VALIDAR PRODUCTO
  // ==================================

  if (indiceProducto === "") {
    alert("Seleccione un producto.");

    return;
  }

  // ==================================
  // VALIDAR LOTE
  // ==================================

  if (indiceLote === "") {
    alert("Seleccione un lote.");

    return;
  }

  // ==================================
  // VALIDAR CANTIDAD
  // ==================================

  if (cantidad <= 0 || isNaN(cantidad)) {
    alert("La cantidad debe ser mayor que cero.");

    return;
  }

  const producto = productos[indiceProducto];

  const lote = lotes[indiceLote];

  if (!producto) {
    alert("No se encontró el producto.");

    return;
  }

  if (!lote) {
    alert("No se encontró el lote.");

    return;
  }

  // ==================================
  // VERIFICAR CANTIDAD DEL LOTE
  // ==================================

  if (cantidad > Number(lote.cantidad)) {
    alert("La cantidad supera la disponibilidad del lote.");

    return;
  }

  // ==================================
  // BUSCAR PRODUCTO + LOTE
  // ==================================

  const productoExistente = carrito.find(function (item) {
    return (
      item.indiceProducto === Number(indiceProducto) &&
      item.indiceLote === Number(indiceLote)
    );
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
      indiceProducto: Number(indiceProducto),

      indiceLote: Number(indiceLote),

      nombre: producto.nombre,

      numeroLote: lote.numeroLote,

      precio: Number(producto.precio),

      cantidad: cantidad,
    });
  }

  // ==================================
  // LIMPIAR
  // ==================================

  selectorProducto.value = "";

  selectorLote.innerHTML = `
            <option value="">
                Seleccione un lote
            </option>
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
// REGISTRAR VENTA
// ==========================================

botonRegistrarVenta.addEventListener("click", function () {
  const indiceCliente = selectorCliente.value;

  const metodoPago = document.getElementById("metodoPago").value;

  // ==================================
  // VALIDAR CLIENTE
  // ==================================

  if (indiceCliente === "") {
    alert("Seleccione un cliente.");

    return;
  }

  // ==================================
  // VALIDAR MÉTODO DE PAGO
  // ==================================

  if (metodoPago === "") {
    alert("Seleccione un método de pago.");

    return;
  }

  // ==================================
  // VALIDAR CARRITO
  // ==================================

  if (carrito.length === 0) {
    alert("Debe agregar al menos un producto.");

    return;
  }

  const cliente = clientes[indiceCliente];

  if (!cliente) {
    alert("No se encontró el cliente.");

    return;
  }

  // ==================================
  // CALCULAR TOTAL
  // ==================================

  let total = 0;

  carrito.forEach(function (item) {
    total = total + Number(item.precio) * Number(item.cantidad);
  });

  // ==================================
  // VERIFICAR STOCK DE PRODUCTOS Y LOTES
  // ==================================

  for (let item of carrito) {
    const producto = productos[item.indiceProducto];

    const lote = lotes[item.indiceLote];

    if (!producto) {
      alert("No se encontró uno de los productos.");

      return;
    }

    if (!lote) {
      alert("No se encontró uno de los lotes.");

      return;
    }

    if (Number(item.cantidad) > Number(producto.stock)) {
      alert("No hay suficiente stock para " + producto.nombre);

      return;
    }

    if (Number(item.cantidad) > Number(lote.cantidad)) {
      alert("No hay suficiente cantidad en el lote " + lote.numeroLote);

      return;
    }
  }

  // ==================================
  // FECHA
  // ==================================

  const fecha = new Date().toLocaleString("es-CO");

  // ==================================
  // DESCONTAR STOCK Y LOTES
  // ==================================

  carrito.forEach(function (item) {
    const producto = productos[item.indiceProducto];

    const lote = lotes[item.indiceLote];

    // Descontar stock general

    producto.stock = Number(producto.stock) - Number(item.cantidad);

    // Descontar cantidad del lote

    lote.cantidad = Number(lote.cantidad) - Number(item.cantidad);

    // Actualizar estado del lote

    if (lote.cantidad <= 0) {
      lote.cantidad = 0;

      lote.estado = "Agotado";
    } else {
      lote.estado = "Disponible";
    }

    // ==================================
    // REGISTRAR SALIDA
    // ==================================

    const nuevoMovimiento = {
      fecha: fecha,

      producto: producto.nombre,

      lote: lote.numeroLote,

      tipo: "Salida",

      cantidad: Number(item.cantidad),
    };

    movimientos.push(nuevoMovimiento);
  });

  // ==================================
  // CREAR VENTA
  // ==================================

  const nuevaVenta = {
    fecha: fecha,

    cliente: cliente.nombre,

    total: total,

    metodoPago: metodoPago,

    productos: carrito,
  };

  // ==================================
  // GUARDAR VENTA
  // ==========================================

  ventas.push(nuevaVenta);

  localStorage.setItem("ventas", JSON.stringify(ventas));

  // ==========================================
  // REGISTRAR INGRESO EN CAJA
  // ==========================================

  const movimientoCaja = {
    fecha: fecha,

    tipo: "Ingreso",

    concepto: "Venta - " + cliente.nombre,

    valor: total,
  };

  movimientosCaja.push(movimientoCaja);

  localStorage.setItem("movimientosCaja", JSON.stringify(movimientosCaja));

  // ==================================
  // GUARDAR PRODUCTOS
  // ==========================================

  localStorage.setItem("productos", JSON.stringify(productos));

  // ==================================
  // GUARDAR LOTES
  // ==========================================

  localStorage.setItem("lotes", JSON.stringify(lotes));

  // ==================================
  // GUARDAR MOVIMIENTOS
  // ==========================================

  localStorage.setItem("movimientos", JSON.stringify(movimientos));

  // ==================================
  // VACIAR CARRITO
  // ==================================

  carrito = [];

  // ==================================
  // LIMPIAR CAMPOS
  // ==================================

  selectorCliente.value = "";

  document.getElementById("metodoPago").value = "";

  selectorProducto.value = "";

  selectorLote.innerHTML = `
            <option value="">
                Seleccione un lote
            </option>
        `;

  inputCantidad.value = 1;

  // ==================================
  // ACTUALIZAR
  // ==================================

  mostrarCarrito();

  mostrarVentas();

  cargarProductos();

  // ==================================
  // MENSAJE
  // ==================================

  alert("Venta registrada correctamente.");
});

// ==========================================
// HISTORIAL DE VENTAS
// ==========================================

function mostrarVentas() {
  tablaVentas.innerHTML = "";

  if (ventas.length === 0) {
    tablaVentas.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="text-center py-4"
                >

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

            <td>
                ${venta.fecha}
            </td>

            <td>
                ${venta.cliente}
            </td>

            <td>
                <strong>
                    $${Number(venta.total).toLocaleString("es-CO")}
                </strong>
            </td>

            <td>
    ${venta.metodoPago}

<td>


    <button
        class="btn btn-accion btn-agro"
        onclick="verDetalleVenta(${ventas.indexOf(venta)})"
        title="Ver detalle de la venta"
    >
        <i class="fa-solid fa-eye"></i>
    </button>

    <button
        class="btn btn-accion btn-agro"
        onclick="registrarDevolucion(${ventas.indexOf(venta)})"
        title="Registrar devolución"
    >
        <i class="fa-solid fa-rotate-left"></i>
    </button>

</td>

        `;

    tablaVentas.appendChild(fila);
  });
}

// ==========================================
// VER DETALLE DE UNA VENTA
// ==========================================

function verDetalleVenta(indice) {
  const venta = ventas[indice];

  if (!venta) {
    alert("No se encontró la venta.");

    return;
  }

  let detalle = "";

  detalle += "DETALLE DE LA VENTA\n\n";

  detalle += "Fecha: " + venta.fecha + "\n";

  detalle += "Cliente: " + venta.cliente + "\n";

  detalle += "Método de pago: " + venta.metodoPago + "\n\n";

  detalle += "PRODUCTOS:\n";

  venta.productos.forEach(function (item) {
    detalle +=
      "- " +
      item.nombre +
      " | Lote: " +
      item.numeroLote +
      " | Cantidad: " +
      item.cantidad +
      "\n";
  });

  detalle += "\nTotal: $" + Number(venta.total).toLocaleString("es-CO");

  alert(detalle);
}

// ==========================================
// REGISTRAR DEVOLUCIÓN
// ==========================================

function registrarDevolucion(indiceVenta) {
  const venta = ventas[indiceVenta];

  if (!venta) {
    alert("No se encontró la venta.");
    return;
  }

  if (!venta.productos || venta.productos.length === 0) {
    alert("Esta venta no tiene productos.");
    return;
  }

  let mensaje = "PRODUCTOS DE LA VENTA:\n\n";

  venta.productos.forEach(function (item, indice) {
    const cantidadDevuelta = Number(item.cantidadDevuelta) || 0;
    const disponibleDevolver = Number(item.cantidad) - cantidadDevuelta;

    mensaje +=
      indice +
      1 +
      ". " +
      item.nombre +
      " | Lote: " +
      item.numeroLote +
      " | Vendido: " +
      item.cantidad +
      " | Disponible para devolver: " +
      disponibleDevolver +
      "\n";
  });

  const seleccion = prompt(
    mensaje + "\nEscribe el número del producto que deseas devolver:",
  );

  if (seleccion === null) {
    return;
  }

  const indiceProducto = Number(seleccion) - 1;

  if (indiceProducto < 0 || indiceProducto >= venta.productos.length) {
    alert("Producto seleccionado no válido.");
    return;
  }

  const item = venta.productos[indiceProducto];

  const cantidadDevueltaActual = Number(item.cantidadDevuelta) || 0;

  const disponibleDevolver = Number(item.cantidad) - cantidadDevueltaActual;

  if (disponibleDevolver <= 0) {
    alert("Este producto ya fue devuelto completamente.");
    return;
  }

  const cantidad = Number(
    prompt(
      "Cantidad a devolver de " +
        item.nombre +
        ":\n\n" +
        "Máximo permitido: " +
        disponibleDevolver,
    ),
  );

  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    alert("La cantidad debe ser un número entero mayor que 0.");
    return;
  }

  if (cantidad > disponibleDevolver) {
    alert("No puedes devolver más de la cantidad vendida.");
    return;
  }

  // ==========================================
  // CALCULAR VALOR DE LA DEVOLUCIÓN
  // ==========================================

  const valorDevolucion = Number(item.precio) * cantidad;

  // Buscar el producto
  const producto = productos[item.indiceProducto];

  if (!producto) {
    alert("No se encontró el producto.");
    return;
  }

  // Buscar el lote
  const lote = lotes[item.indiceLote];

  if (!lote) {
    alert("No se encontró el lote.");
    return;
  }

  // Devolver al stock del producto
  producto.stock = (Number(producto.stock) || 0) + cantidad;

  // Devolver al lote
  lote.cantidad = (Number(lote.cantidad) || 0) + cantidad;

  lote.estado = "Disponible";

  // Guardar cantidad devuelta
  item.cantidadDevuelta = cantidadDevueltaActual + cantidad;

  // Guardar valor devuelto
  item.valorDevuelto = (Number(item.valorDevuelto) || 0) + valorDevolucion;

  // Registrar movimiento
  movimientos.push({
    fecha: new Date().toLocaleString("es-CO"),
    producto: item.nombre,
    lote: item.numeroLote,
    tipo: "Entrada",
    cantidad: cantidad,
  });

  // ==========================================
  // REGISTRAR DEVOLUCIÓN EN CAJA
  // ==========================================

  movimientosCaja = JSON.parse(localStorage.getItem("movimientosCaja")) || [];

  movimientosCaja.push({
    fecha: new Date().toLocaleString("es-CO"),

    tipo: "Egreso",

    concepto: "Devolución - " + item.nombre,

    valor: valorDevolucion,
  });

  localStorage.setItem("movimientosCaja", JSON.stringify(movimientosCaja));

  // Guardar información actualizada
  localStorage.setItem("productos", JSON.stringify(productos));

  localStorage.setItem("lotes", JSON.stringify(lotes));

  localStorage.setItem("movimientos", JSON.stringify(movimientos));

  localStorage.setItem("ventas", JSON.stringify(ventas));

  alert(
    "Devolución registrada correctamente.\n\n" +
    "Producto: " +
    item.nombre +
    "\n" +
    "Lote: " +
    item.numeroLote +
    "\n" +
    "Cantidad devuelta: " +
    cantidad +
    "\n" +
    "Valor devuelto: $" +
    valorDevolucion.toLocaleString("es-CO")
);

  mostrarVentas();
}

// ==========================================
// INICIAR VENTAS
// ==========================================

cargarClientes();

cargarProductos();

mostrarCarrito();

mostrarVentas();
