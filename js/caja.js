// ==========================================
// OBTENER MOVIMIENTOS DE CAJA
// ==========================================

let movimientosCaja = JSON.parse(localStorage.getItem("movimientosCaja")) || [];

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
// MOSTRAR MOVIMIENTOS
// ==========================================

function mostrarMovimientos() {
  tablaCaja.innerHTML = "";

  movimientosCaja.forEach(function (movimiento) {
    const fila = document.createElement("tr");

    fila.innerHTML = `
            <td>${movimiento.fecha}</td>
            <td>${movimiento.tipo}</td>
            <td>${movimiento.concepto}</td>
            <td>$${movimiento.valor.toLocaleString("es-CO")}</td>
        `;

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
    if (movimiento.tipo === "Ingreso") {
      ingresos += movimiento.valor;
    }

    if (movimiento.tipo === "Egreso") {
      egresos += movimiento.valor;
    }
  });

  const saldo = ingresos - egresos;

  totalIngresos.textContent = ingresos.toLocaleString("es-CO");

  totalEgresos.textContent = egresos.toLocaleString("es-CO");

  saldoActual.textContent = saldo.toLocaleString("es-CO");
}

// ==========================================
// REGISTRAR MOVIMIENTO
// ==========================================

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const tipo = tipoMovimiento.value;

  const descripcion = concepto.value.trim();

  const monto = Number(valor.value);

  // Validar datos

  if (tipo === "" || descripcion === "" || monto <= 0) {
    alert("Por favor complete todos los campos correctamente.");

    return;
  }

  // Crear movimiento

  const nuevoMovimiento = {
    fecha: new Date().toLocaleDateString("es-CO"),

    tipo: tipo,

    concepto: descripcion,

    valor: monto,
  };

  // Agregar movimiento

  movimientosCaja.push(nuevoMovimiento);

  // Guardar en LocalStorage

  localStorage.setItem("movimientosCaja", JSON.stringify(movimientosCaja));

  // Limpiar formulario

  formulario.reset();

  // Actualizar pantalla

  mostrarMovimientos();

  actualizarResumen();

  alert("Movimiento registrado correctamente.");
});

// ==========================================
// CARGAR INFORMACIÓN AL ABRIR LA PÁGINA
// ==========================================

mostrarMovimientos();

actualizarResumen();
