// ==========================================
// OBTENER INFORMACIÓN DE LOCALSTORAGE
// ==========================================

let productos = JSON.parse(localStorage.getItem("productos")) || [];

let clientes = JSON.parse(localStorage.getItem("clientes")) || [];

let proveedores = JSON.parse(localStorage.getItem("proveedores")) || [];

let ventas = JSON.parse(localStorage.getItem("ventas")) || [];

let movimientosCaja = JSON.parse(localStorage.getItem("movimientosCaja")) || [];

let lotes = JSON.parse(localStorage.getItem("lotes")) || [];

// ==========================================
// RESUMEN GENERAL
// ==========================================

document.getElementById("totalProductos").textContent = productos.length;

document.getElementById("totalClientes").textContent = clientes.length;

document.getElementById("totalProveedores").textContent = proveedores.length;

document.getElementById("totalVentas").textContent = ventas.length;

// ==========================================
// RESUMEN DE VENTAS
// ==========================================

let valorTotalVentas = 0;

let clientesConCompras = [];

ventas.forEach(function (venta) {
  valorTotalVentas += Number(venta.total) || 0;

  if (venta.cliente && !clientesConCompras.includes(venta.cliente)) {
    clientesConCompras.push(venta.cliente);
  }
});

let ventaPromedio = 0;

if (ventas.length > 0) {
  ventaPromedio = valorTotalVentas / ventas.length;
}

document.getElementById("valorVentas").textContent =
  "$" + valorTotalVentas.toLocaleString("es-CO");

document.getElementById("ventaPromedio").textContent =
  "$" + ventaPromedio.toLocaleString("es-CO");

document.getElementById("clientesConCompras").textContent =
  clientesConCompras.length;

// ==========================================
// ESTADO DEL INVENTARIO
// ==========================================

let productosDisponibles = 0;
let productosStockBajo = 0;
let productosAgotados = 0;

productos.forEach(function (producto) {
  let stock = Number(producto.stock) || 0;

  let stockMinimo = Number(producto.stockMinimo) || 0;

  if (stock <= 0) {
    productosAgotados++;
  } else if (stock <= stockMinimo) {
    productosStockBajo++;
  } else {
    productosDisponibles++;
  }
});

document.getElementById("productosDisponibles").textContent =
  productosDisponibles;

document.getElementById("productosStockBajo").textContent = productosStockBajo;

document.getElementById("productosAgotados").textContent = productosAgotados;

// ==========================================
// RESUMEN DE CAJA
// ==========================================

let ingresos = 0;
let egresos = 0;

movimientosCaja.forEach(function (movimiento) {
  let valor = Number(movimiento.valor) || 0;

  if (movimiento.tipo === "Ingreso") {
    ingresos += valor;
  } else if (movimiento.tipo === "Egreso") {
    egresos += valor;
  }
});

let saldo = ingresos - egresos;

document.getElementById("reporteIngresos").textContent =
  "$" + ingresos.toLocaleString("es-CO");

document.getElementById("reporteEgresos").textContent =
  "$" + egresos.toLocaleString("es-CO");

document.getElementById("reporteSaldo").textContent =
  "$" + saldo.toLocaleString("es-CO");

// ==========================================
// PRODUCTOS PRÓXIMOS A AGOTARSE
// ==========================================

const tablaProductosAgotarse = document.getElementById(
  "tablaProductosAgotarse",
);

let productosAgotarse = productos.filter(function (producto) {
  let stock = Number(producto.stock) || 0;

  let stockMinimo = Number(producto.stockMinimo) || 0;

  return stock <= stockMinimo;
});

if (productosAgotarse.length === 0) {
  tablaProductosAgotarse.innerHTML = `
        <tr>
            <td colspan="5" class="text-center">
                No hay productos próximos a agotarse.
            </td>
        </tr>
    `;
} else {
  tablaProductosAgotarse.forEach;

  productosAgotarse.forEach(function (producto) {
    let stock = Number(producto.stock) || 0;

    let stockMinimo = Number(producto.stockMinimo) || 0;

    let estado = "";

    if (stock <= 0) {
      estado = `
                <span class="badge bg-danger">
                    Agotado
                </span>
            `;
    } else {
      estado = `
                <span class="badge bg-warning text-dark">
                    Stock bajo
                </span>
            `;
    }

    tablaProductosAgotarse.innerHTML += `
            <tr>

                <td>
                    ${producto.codigo || ""}
                </td>

                <td>
                    ${producto.nombre || ""}
                </td>

                <td>
                    ${stock}
                </td>

                <td>
                    ${stockMinimo}
                </td>

                <td>
                    ${estado}
                </td>

            </tr>
        `;
  });
}

// ==========================================
// LOTES PRÓXIMOS A VENCER
// ==========================================

const tablaLotesVencer = document.getElementById("tablaLotesVencer");

const hoy = new Date();

hoy.setHours(0, 0, 0, 0);

// ------------------------------------------
// FILTRAR LOTES
// ------------------------------------------

let lotesProximos = lotes.filter(function (lote) {
  if (!lote.fechaVencimiento) {
    return false;
  }

  let fechaVencimiento = new Date(lote.fechaVencimiento + "T00:00:00");

  fechaVencimiento.setHours(0, 0, 0, 0);

  let diferencia = fechaVencimiento - hoy;

  let dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

  return dias <= 90;
});

// ------------------------------------------
// ORDENAR POR FECHA DE VENCIMIENTO
// ------------------------------------------

lotesProximos.sort(function (a, b) {
  return (
    new Date(a.fechaVencimiento + "T00:00:00") -
    new Date(b.fechaVencimiento + "T00:00:00")
  );
});

// ------------------------------------------
// MOSTRAR LOTES
// ------------------------------------------

if (lotesProximos.length === 0) {
  tablaLotesVencer.innerHTML = `
        <tr>
            <td colspan="5" class="text-center">
                No hay lotes próximos a vencer.
            </td>
        </tr>
    `;
} else {
  lotesProximos.forEach(function (lote) {
    let fechaVencimiento = new Date(lote.fechaVencimiento + "T00:00:00");

    fechaVencimiento.setHours(0, 0, 0, 0);

    let diferencia = fechaVencimiento - hoy;

    let dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

    let estado = "";

    if (dias < 0) {
      estado = `
                <span class="badge bg-danger">
                    Vencido
                </span>
            `;
    } else if (dias === 0) {
    estado = `
                <span class="badge bg-danger">
                    Vence hoy
                </span>
            `;
    } else if (dias <= 30) {
    estado = `
                <span class="badge bg-danger">
                    Vence en ${dias} días
                </span>
            `;
    } else if (dias <= 60) {
    estado = `
                <span class="badge bg-warning text-dark">
                    Vence en ${dias} días
                </span>
            `;
    } else {
    estado = `
                <span class="badge bg-info text-dark">
                    Vence en ${dias} días
                </span>
            `;
    }

    // ------------------------------------------
    // BUSCAR NOMBRE DEL PRODUCTO
    // ------------------------------------------

    let productoEncontrado = productos.find(function (producto) {
    return producto.codigo === lote.productoCodigo;
    });

    let nombreProducto = "";

    if (productoEncontrado) {
    nombreProducto = productoEncontrado.nombre;
    } else {
    nombreProducto =
        lote.productoNombre || lote.producto || "Producto no encontrado";
    }

    tablaLotesVencer.innerHTML += `
            <tr>

                <td>
                    ${nombreProducto}
                </td>

                <td>
                    ${lote.numeroLote || ""}
                </td>

                <td>
                    ${lote.fechaVencimiento}
                </td>

                <td>
                    ${lote.cantidad || 0}
                </td>

                <td>
                    ${estado}
                </td>

            </tr>
        `;
});
}
