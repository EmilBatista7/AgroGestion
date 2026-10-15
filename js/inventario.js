// ==========================================
// OBTENER INFORMACIÓN DE LOCALSTORAGE
// ==========================================

let productos = JSON.parse(localStorage.getItem("productos")) || [];

let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];

let lotes = JSON.parse(localStorage.getItem("lotes")) || [];

// ==========================================
// ELEMENTOS HTML
// ==========================================

const formulario = document.getElementById("formInventario");

const selectorProducto = document.getElementById("producto");

const selectorLote = document.getElementById("lote");

const tablaInventario = document.getElementById("tablaInventario");

const tablaMovimientos = document.getElementById("tablaMovimientos");

// ==========================================
// CARGAR PRODUCTOS EN EL SELECTOR
// ==========================================

function cargarProductos() {
  selectorProducto.innerHTML = `
        <option value="">
            Seleccione un producto
        </option>
    `;

  productos.forEach(function (producto, indice) {
    selectorProducto.innerHTML += `
            <option value="${indice}">
                ${producto.codigo} - ${producto.nombre}
            </option>
        `;
  });
}

// ==========================================
// CARGAR LOTES SEGÚN EL PRODUCTO
// ==========================================

function cargarLotes() {

    const indiceProducto = selectorProducto.value;

    // Limpiar selector de lotes

    selectorLote.innerHTML = "";

    // Si no hay producto seleccionado

    if (indiceProducto === "") {

        selectorLote.innerHTML = `
            <option value="">
                Seleccione primero un producto
            </option>
        `;

        return;
    }

    // Obtener producto seleccionado

    const productoSeleccionado = productos[indiceProducto];

    // Verificar que el producto exista

    if (!productoSeleccionado) {

        selectorLote.innerHTML = `
            <option value="">
                Producto no encontrado
            </option>
        `;

        return;
    }

    // Código del producto seleccionado

    const codigoProducto = String(productoSeleccionado.codigo).trim();

    // Buscar lotes pertenecientes al producto

    const lotesProducto = lotes.filter(function (lote) {

        const codigoLote = String(lote.productoCodigo || "").trim();

        return codigoLote === codigoProducto;

    });

    // Si no hay lotes

    if (lotesProducto.length === 0) {

        selectorLote.innerHTML = `
            <option value="">
                Este producto no tiene lotes registrados
            </option>
        `;

        return;
    }

    // Opción inicial

    selectorLote.innerHTML = `
        <option value="">
            Seleccione un lote
        </option>
    `;

    // Cargar los lotes encontrados

    lotesProducto.forEach(function (lote) {

        const opcion = document.createElement("option");

        opcion.value = lote.numeroLote;

        opcion.textContent =
            `${lote.numeroLote} - Vence: ${lote.fechaVencimiento} - Cantidad: ${lote.cantidad}`;

        selectorLote.appendChild(opcion);

    });
}

selectorProducto.addEventListener("change", cargarLotes);


// ==========================================
// CALCULAR STOCK SEGÚN LOS LOTES
// ==========================================

function calcularStockPorLotes(producto) {

const lotesProducto = lotes.filter(function (lote) {

return String(lote.productoCodigo).trim() ===
    String(producto.codigo).trim();

});

let stockTotal = 0;

lotesProducto.forEach(function (lote) {

    stockTotal += Number(lote.cantidad) || 0;

});

return stockTotal;
}

function actualizarStockProducto(producto) {
  const lotesProducto = lotes.filter(function (lote) {
    return (
    String(lote.productoCodigo).trim() === String(producto.codigo).trim()
    );
});

let stockTotal = 0;

lotesProducto.forEach(function (lote) {
    stockTotal += Number(lote.cantidad) || 0;
});

producto.stock = stockTotal;
}


// ==========================================
// MOSTRAR INVENTARIO
// ==========================================

function mostrarInventario() {
  tablaInventario.innerHTML = "";

  if (productos.length === 0) {
    tablaInventario.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fa-solid fa-box-open me-2"></i>
                    No hay productos registrados.
                </td>
            </tr>
        `;

    return;
  }

  productos.forEach(function (producto) {
    // Convertir valores a números
    // Calcular stock real según los lotes
    const stockActual = calcularStockPorLotes(producto);

    const stockMinimo = Number(producto.stockMinimo) || 0;

    // ==========================================
    // DETERMINAR ESTADO DEL STOCK
    // ==========================================

    let estadoStock = "";

    // AGOTADO

    if (stockActual === 0) {
      estadoStock = `
                <span class="stock-badge stock-agotado">

                    <i class="fa-solid fa-circle-xmark"></i>

                    Agotado

                </span>
            `;
    }

    // STOCK BAJO
    else if (stockActual <= stockMinimo) {
      estadoStock = `
                <span class="stock-badge stock-bajo">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    Stock bajo

                </span>
            `;
    }

    // DISPONIBLE
    else {
      estadoStock = `
                <span class="stock-badge stock-normal">

                    <i class="fa-solid fa-circle-check"></i>

                    Disponible

                </span>
            `;
    }

    // ==========================================
    // CREAR FILA
    // ==========================================

    const fila = document.createElement("tr");

    fila.innerHTML = `

            <td>

                <span class="codigo-producto">

                    ${producto.codigo}

                </span>

            </td>


            <td>

                <span class="nombre-producto">

                    <i class="fa-solid fa-box producto-mini-icon"></i>

                    ${producto.nombre}

                </span>

            </td>


            <td>

                <span class="categoria-producto">

                    ${producto.categoria}

                </span>

            </td>


            <td>

                <strong class="stock-numero">

                    ${stockActual}

                </strong>

            </td>


            <td>

                ${stockMinimo}

            </td>


            <td>

                ${estadoStock}

            </td>

        `;

    tablaInventario.appendChild(fila);
  });
}

// ==========================================
// MOSTRAR HISTORIAL DE MOVIMIENTOS
// ==========================================

function mostrarMovimientos() {
  tablaMovimientos.innerHTML = "";

  if (movimientos.length === 0) {
    tablaMovimientos.innerHTML = `
            <tr>

                <td colspan="5" class="text-center py-4">

                    <i class="fa-solid fa-clock-rotate-left me-2"></i>

                    No hay movimientos registrados.

                </td>

            </tr>
        `;

    return;
  }

  movimientos.forEach(function (movimiento) {
    const fila = document.createElement("tr");

    // Determinar icono según el movimiento

    let tipoMovimiento = "";

    if (movimiento.tipo === "Entrada") {
      tipoMovimiento = `
                <span class="stock-badge stock-normal">

                    <i class="fa-solid fa-arrow-down"></i>

                    Entrada

                </span>
            `;
    } else {
      tipoMovimiento = `
                <span class="stock-badge stock-bajo">

                    <i class="fa-solid fa-arrow-up"></i>

                    Salida

                </span>
            `;
    }

    fila.innerHTML = `
    <td>
        ${movimiento.fecha}
    </td>

    <td>
        <span class="nombre-producto">
            <i class="fa-solid fa-box producto-mini-icon"></i>
            ${movimiento.producto}
        </span>
    </td>

    <td>
        <strong>
            ${movimiento.lote || "N/A"}
        </strong>
    </td>

    <td>
        ${tipoMovimiento}
    </td>

    <td>
        <strong>
            ${movimiento.cantidad}
        </strong>
    </td>
`;

    tablaMovimientos.appendChild(fila);
  });
}

// ==========================================
// REGISTRAR MOVIMIENTO
// ==========================================

formulario.addEventListener("submit", function (event) {
  event.preventDefault();

  // Obtener datos del formulario

  const indiceProducto = selectorProducto.value;

  const tipo = document.getElementById("tipoMovimiento").value;

  const cantidad = Number(document.getElementById("cantidad").value);

  const loteSeleccionado = selectorLote.value;

  // ==========================================
  // VALIDAR PRODUCTO
  // ==========================================

  if (indiceProducto === "") {
    alert("Seleccione un producto.");

    return;
  }

  // ==========================================
  // VALIDAR LOTE
  // ==========================================

  if (loteSeleccionado === "") {
    alert("Seleccione un lote.");

    return;
  }

  // ==========================================
  // VALIDAR TIPO
  // ==========================================

  if (tipo !== "Entrada" && tipo !== "Salida") {
    alert("Seleccione un tipo de movimiento.");

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
  // OBTENER PRODUCTO
  // ==========================================

  const producto = productos[indiceProducto];

  // ==========================================
  // BUSCAR LOTE SELECCIONADO
  // ==========================================

  const lote = lotes.find(function (lote) {
    return lote.numeroLote === loteSeleccionado;
  });

  if (!lote) {
    alert("No se encontró el lote seleccionado.");

    return;
}

  // Convertir stock actual a número

const stockActual = Number(producto.stock) || 0;

  // ==========================================
  // ENTRADA
  // ==========================================

if (tipo === "Entrada") {
    // Aumentar stock general del producto

    producto.stock = stockActual + cantidad;

    // Aumentar cantidad del lote

    lote.cantidad = Number(lote.cantidad) + cantidad;
    }
    
    // El lote vuelve a estar disponible
lote.estado = "Disponible";

 // ==========================================
// SALIDA
// ==========================================

if (tipo === "Salida") {

    // Cantidad disponible en el lote

    const cantidadLote = Number(lote.cantidad) || 0;

    // Verificar stock general

    if (cantidad > stockActual) {

        alert("No hay suficiente stock del producto.");

        return;
    }

    // Verificar stock del lote

    if (cantidad > cantidadLote) {

        alert(
            "No hay suficiente cantidad disponible en el lote seleccionado."
        );

        return;
    }

    // Descontar del producto

    producto.stock = stockActual - cantidad;

    // Descontar del lote

    lote.cantidad = cantidadLote - cantidad;

}

  // Actualizar estado del lote
if (lote.cantidad <= 0) {
    lote.cantidad = 0;
    lote.estado = "Agotado";
} else {
    lote.estado = "Disponible";
}  
    

  // ==========================================
  // FECHA Y HORA
  // ==========================================

  const fecha = new Date().toLocaleString("es-CO");

  // ==========================================
  // CREAR MOVIMIENTO
  // ==========================================

  const movimiento = {
    fecha: fecha,

    producto: producto.nombre,

    lote: lote.numeroLote,

    tipo: tipo,

    cantidad: cantidad,
  };

  // Agregar movimiento al historial

  movimientos.push(movimiento);

  // ==========================================
  // GUARDAR INFORMACIÓN
  // ==========================================

  localStorage.setItem("productos", JSON.stringify(productos));

  localStorage.setItem("movimientos", JSON.stringify(movimientos));

  localStorage.setItem("lotes", JSON.stringify(lotes));

  // ==========================================
  // LIMPIAR FORMULARIO
  // ==========================================

  formulario.reset();

  // ==========================================
  // ACTUALIZAR INFORMACIÓN
  // ==========================================

  cargarProductos();

  mostrarInventario();

  mostrarMovimientos();

  // ==========================================
  // MENSAJE
  // ==========================================

  alert("Movimiento registrado correctamente.");
});

// ==========================================
// CARGAR INFORMACIÓN AL ABRIR LA PÁGINA
// ==========================================

cargarProductos();

cargarLotes();

mostrarInventario();

mostrarMovimientos();
