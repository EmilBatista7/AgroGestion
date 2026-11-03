// ==========================================
// CONFIGURACIÓN DE LA API
// ==========================================

const API = "http://127.0.0.1:5001/api";

let movimientosCaja = [];

// ==========================================
// ELEMENTOS HTML
// ==========================================

const formulario = document.getElementById("formCaja");
const tipoMovimiento = document.getElementById("tipoMovimiento");
const concepto = document.getElementById("concepto");
const valor = document.getElementById("valor");

const tablaCaja = document.getElementById("tablaCaja");

const totalIngresos = document.getElementById("totalIngresos");
const totalEgresos = document.getElementById("totalEgresos");
const saldoActual = document.getElementById("saldoActual");

// ==========================================
// CONSULTAR API
// ==========================================

async function consultarAPI(ruta, opciones = {}) {
  const respuesta = await fetch(API + ruta, opciones);

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || "Ocurrió un error en la solicitud.");
  }

  return datos;
}

// ==========================================
// CARGAR MOVIMIENTOS DESDE MYSQL
// ==========================================

async function cargarMovimientos() {
  try {
    movimientosCaja = await consultarAPI("/movimientos-caja");

    mostrarMovimientos();

    actualizarResumen();
  } catch (error) {
    console.error("Error al cargar caja:", error);

    alert("No fue posible cargar los movimientos de caja: " + error.message);
  }
}

// ==========================================
// MOSTRAR MOVIMIENTOS
// ==========================================

function mostrarMovimientos() {
  tablaCaja.innerHTML = "";

  movimientosCaja.forEach(function (movimiento) {
    const fila = document.createElement("tr");

    const fecha = document.createElement("td");
    fecha.textContent = movimiento.fecha;

    const tipo = document.createElement("td");
    tipo.textContent = movimiento.tipo;

    const descripcion = document.createElement("td");
    descripcion.textContent = movimiento.concepto;

    const monto = document.createElement("td");
    monto.className = "text-end";
    monto.textContent = "$" + Number(movimiento.valor).toLocaleString("es-CO");

    fila.appendChild(fecha);
    fila.appendChild(tipo);
    fila.appendChild(descripcion);
    fila.appendChild(monto);

    tablaCaja.appendChild(fila);
  });
}

// ==========================================
// ACTUALIZAR RESUMEN DE CAJA
// ==========================================

function actualizarResumen() {
  let ingresos = 0;
  let egresos = 0;

  movimientosCaja.forEach(function (movimiento) {
    const monto = Number(movimiento.valor);

    if (movimiento.tipo === "Ingreso") {
      ingresos += monto;
    }

    if (movimiento.tipo === "Egreso") {
      egresos += monto;
    }
  });

  const saldo = ingresos - egresos;

  totalIngresos.textContent = ingresos.toLocaleString("es-CO");

  totalEgresos.textContent = egresos.toLocaleString("es-CO");

  saldoActual.textContent = saldo.toLocaleString("es-CO");
}

// ==========================================
// REGISTRAR MOVIMIENTO MANUAL
// ==========================================

formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const tipo = tipoMovimiento.value;

  const descripcion = concepto.value.trim();

  const monto = Number(valor.value);

  // Validar información

  if (
    tipo === "" ||
    descripcion === "" ||
    !Number.isFinite(monto) ||
    monto <= 0
  ) {
    alert("Por favor complete todos los campos correctamente.");

    return;
  }

  try {
    const datos = {
      tipo: tipo,
      concepto: descripcion,
      valor: monto,
    };

    await consultarAPI("/movimientos-caja", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(datos),
    });

    formulario.reset();

    await cargarMovimientos();

    alert("Movimiento registrado correctamente.");
  } catch (error) {
    console.error("Error al registrar movimiento:", error);

    alert("No fue posible registrar el movimiento: " + error.message);
  }
});

// ==========================================
// INICIAR MÓDULO CAJA
// ==========================================

cargarMovimientos();
