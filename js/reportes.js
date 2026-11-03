// ==========================================
// CONFIGURACIÓN DE LA API
// ==========================================

const API = "http://127.0.0.1:5001/api";

// ==========================================
// FUNCIONES GENERALES
// ==========================================

function formatoMoneda(valor) {
  return (
    "$" +
    Number(valor || 0).toLocaleString("es-CO", {
      maximumFractionDigits: 2,
    })
  );
}

function mostrarMensaje(tabla, columnas, mensaje) {
  const fila = document.createElement("tr");
  const celda = document.createElement("td");

  celda.colSpan = columnas;
  celda.className = "text-center text-muted";
  celda.textContent = mensaje;

  fila.appendChild(celda);
  tabla.replaceChildren(fila);
}

async function consultarAPI(ruta) {
  const respuesta = await fetch(`${API}/${ruta}`);

  if (!respuesta.ok) {
    throw new Error(`Error al consultar ${ruta}`);
  }

  return await respuesta.json();
}

// ==========================================
// CARGAR TODOS LOS REPORTES
// ==========================================

async function cargarReportes() {
  try {
    // Consultar información de MySQL

    const [productos, clientes, proveedores, ventas, movimientosCaja, lotes] =
      await Promise.all([
        consultarAPI("productos"),
        consultarAPI("clientes"),
        consultarAPI("proveedores"),
        consultarAPI("ventas"),
        consultarAPI("movimientos-caja"),
        consultarAPI("lotes"),
      ]);

    // ==========================================
    // RESUMEN GENERAL
    // ==========================================

    document.getElementById("totalProductos").textContent = productos.length;

    document.getElementById("totalClientes").textContent = clientes.length;

    document.getElementById("totalProveedores").textContent =
      proveedores.length;

    document.getElementById("totalVentas").textContent = ventas.length;

    // ==========================================
    // RESUMEN DE VENTAS
    // ==========================================

    let valorTotalVentas = 0;

    const clientesConCompras = new Set();

    ventas.forEach(function (venta) {
      valorTotalVentas += Number(venta.total) || 0;

      if (venta.clienteId) {
        clientesConCompras.add(venta.clienteId);
      } else if (venta.cliente) {
        clientesConCompras.add(venta.cliente);
      }
    });

    let ventaPromedio = 0;

    if (ventas.length > 0) {
      ventaPromedio = valorTotalVentas / ventas.length;
    }

    document.getElementById("valorVentas").textContent =
      formatoMoneda(valorTotalVentas);

    document.getElementById("ventaPromedio").textContent =
      formatoMoneda(ventaPromedio);

    document.getElementById("clientesConCompras").textContent =
      clientesConCompras.size;

    // ==========================================
    // ESTADO DEL INVENTARIO
    // ==========================================

    let productosDisponibles = 0;
    let productosStockBajo = 0;
    let productosAgotados = 0;

    productos.forEach(function (producto) {
      const stock = Number(producto.stock) || 0;
      const stockMinimo = Number(producto.stockMinimo) || 0;

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

    document.getElementById("productosStockBajo").textContent =
      productosStockBajo;

    document.getElementById("productosAgotados").textContent =
      productosAgotados;

    // ==========================================
    // RESUMEN DE CAJA
    // ==========================================

    let ingresos = 0;
    let egresos = 0;

    movimientosCaja.forEach(function (movimiento) {
      const valor = Number(movimiento.valor) || 0;

      if (movimiento.tipo === "Ingreso") {
        ingresos += valor;
      } else if (movimiento.tipo === "Egreso") {
        egresos += valor;
      }
    });

    const saldo = ingresos - egresos;

    document.getElementById("reporteIngresos").textContent =
      formatoMoneda(ingresos);

    document.getElementById("reporteEgresos").textContent =
      formatoMoneda(egresos);

    document.getElementById("reporteSaldo").textContent = formatoMoneda(saldo);

    // ==========================================
    // PRODUCTOS PRÓXIMOS A AGOTARSE
    // ==========================================

    const tablaProductosAgotarse = document.getElementById(
      "tablaProductosAgotarse",
    );

    const productosAgotarse = productos.filter(function (producto) {
      const stock = Number(producto.stock) || 0;
      const stockMinimo = Number(producto.stockMinimo) || 0;

      return stock <= stockMinimo;
    });

    tablaProductosAgotarse.replaceChildren();

    if (productosAgotarse.length === 0) {
      mostrarMensaje(
        tablaProductosAgotarse,
        5,
        "No hay productos próximos a agotarse.",
      );
    } else {
      productosAgotarse.forEach(function (producto) {
        const fila = document.createElement("tr");

        const stock = Number(producto.stock) || 0;
        const stockMinimo = Number(producto.stockMinimo) || 0;

        const estado = document.createElement("span");

        if (stock <= 0) {
          estado.className = "badge bg-danger";
          estado.textContent = "Agotado";
        } else {
          estado.className = "badge bg-warning text-dark";
          estado.textContent = "Stock bajo";
        }

        const datos = [
          producto.codigo || "",
          producto.nombre || "",
          stock,
          stockMinimo,
        ];

        datos.forEach(function (dato) {
          const celda = document.createElement("td");
          celda.textContent = dato;
          fila.appendChild(celda);
        });

        const celdaEstado = document.createElement("td");
        celdaEstado.appendChild(estado);
        fila.appendChild(celdaEstado);

        tablaProductosAgotarse.appendChild(fila);
      });
    }

    // ==========================================
    // LOTES PRÓXIMOS A VENCER
    // ==========================================

    const tablaLotesVencer = document.getElementById("tablaLotesVencer");

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    function convertirFecha(fecha) {
      const partes = String(fecha).substring(0, 10).split("-");

      if (partes.length !== 3) {
        return null;
      }

      const fechaConvertida = new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2]),
      );

      if (isNaN(fechaConvertida.getTime())) {
        return null;
      }

      return fechaConvertida;
    }

    const lotesProximos = lotes.filter(function (lote) {
      if (!lote.fechaVencimiento) {
        return false;
      }

      const fechaVencimiento = convertirFecha(lote.fechaVencimiento);

      if (!fechaVencimiento) {
        return false;
      }

      const diferencia = fechaVencimiento - hoy;

      const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

      return dias <= 90;
    });

    lotesProximos.sort(function (a, b) {
      return (
        convertirFecha(a.fechaVencimiento) - convertirFecha(b.fechaVencimiento)
      );
    });

    tablaLotesVencer.replaceChildren();

    if (lotesProximos.length === 0) {
      mostrarMensaje(tablaLotesVencer, 5, "No hay lotes próximos a vencer.");
    } else {
      lotesProximos.forEach(function (lote) {
        const fila = document.createElement("tr");

        const fechaVencimiento = convertirFecha(lote.fechaVencimiento);

        const diferencia = fechaVencimiento - hoy;

        const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

        const estado = document.createElement("span");

        if (dias < 0) {
          estado.className = "badge bg-danger";
          estado.textContent = "Vencido";
        } else if (dias === 0) {
          estado.className = "badge bg-danger";
          estado.textContent = "Vence hoy";
        } else if (dias <= 30) {
          estado.className = "badge bg-danger";
          estado.textContent = `Vence en ${dias} días`;
        } else if (dias <= 60) {
          estado.className = "badge bg-warning text-dark";
          estado.textContent = `Vence en ${dias} días`;
        } else {
          estado.className = "badge bg-info text-dark";
          estado.textContent = `Vence en ${dias} días`;
        }

        // Buscar nombre del producto

        const productoEncontrado = productos.find(function (producto) {
          return producto.codigo === lote.productoCodigo;
        });

        const nombreProducto = productoEncontrado
          ? productoEncontrado.nombre
          : lote.producto || "Producto no encontrado";

        const datos = [
          nombreProducto,
          lote.numeroLote || "",
          lote.fechaVencimiento || "",
          Number(lote.cantidad) || 0,
        ];

        datos.forEach(function (dato) {
          const celda = document.createElement("td");
          celda.textContent = dato;
          fila.appendChild(celda);
        });

        const celdaEstado = document.createElement("td");
        celdaEstado.appendChild(estado);
        fila.appendChild(celdaEstado);

        tablaLotesVencer.appendChild(fila);
      });
    }

    console.log("Reportes cargados correctamente desde MySQL.");
  } catch (error) {
    console.error("Error al cargar los reportes:", error);

    alert(
      "No fue posible cargar los reportes. " +
        "Verifica que Flask y MySQL estén funcionando.",
    );
  }
}

// ==========================================
// INICIAR REPORTES
// ==========================================

document.addEventListener("DOMContentLoaded", cargarReportes);
