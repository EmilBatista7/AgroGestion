// ==========================================
// PRODUCTOS - AGROGESTIÓN
// Conexión con MySQL mediante Flask
// ==========================================

const API_URL = "http://127.0.0.1:5001/api/productos";

// Productos consultados desde MySQL
let productos = [];

// Formulario
const formulario = document.getElementById("formProducto");

// Tabla
const tabla = document.getElementById("tablaProductos");

// Buscador
const buscador = document.getElementById("buscarProducto");

// ID del producto que se está editando
let idEditando = null;

// ==========================================
// CONSULTAR PRODUCTOS DESDE MYSQL
// ==========================================

async function cargarProductos() {
  try {
    const respuesta = await fetch(API_URL);

    if (!respuesta.ok) {
      throw new Error("No se pudieron consultar los productos");
    }

    productos = await respuesta.json();

    mostrarProductos();
  } catch (error) {
    console.error("Error al consultar productos:", error);

    tabla.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4">
                    No fue posible cargar los productos.
                    Comprueba que Flask esté funcionando.
                </td>
            </tr>
        `;
  }
}

// ==========================================
// MOSTRAR PRODUCTOS
// ==========================================

function mostrarProductos(lista = productos) {
  tabla.innerHTML = "";

  if (lista.length === 0) {
    tabla.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5">
                    <div class="producto-vacio">
                        <i class="fa-solid fa-box-open"></i>
                        <h5>No hay productos registrados</h5>
                        <p>
                            Registra tu primer producto
                            utilizando el formulario.
                        </p>
                    </div>
                </td>
            </tr>
        `;

    return;
  }

  lista.forEach(function (producto) {
    const fila = document.createElement("tr");

    const stockActual = Number(producto.stock) || 0;
    const stockMinimo = Number(producto.stockMinimo) || 0;

    // Estado del stock
    let estadoStock = "";

    if (stockActual === 0) {
      estadoStock = `
                <span class="stock-badge stock-agotado">
                    <i class="fa-solid fa-circle-xmark"></i>
                    Agotado
                </span>
            `;
    } else if (stockActual <= stockMinimo) {
      estadoStock = `
                <span class="stock-badge stock-bajo">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Stock bajo
                </span>
            `;
    } else {
      estadoStock = `
                <span class="stock-badge stock-normal">
                    <i class="fa-solid fa-circle-check"></i>
                    Disponible
                </span>
            `;
    }

    // Estado del producto
    let estadoProducto = "";

    if (producto.estado === "Activo") {
      estadoProducto = `
                <span class="estado-producto estado-activo">
                    <i class="fa-solid fa-circle"></i>
                    Activo
                </span>
            `;
    } else {
      estadoProducto = `
                <span class="estado-producto estado-inactivo">
                    <i class="fa-solid fa-circle"></i>
                    Inactivo
                </span>
            `;
    }

    // Crear fila
    fila.innerHTML = `
            <td>
                <span class="codigo-producto">
                    ${producto.codigo}
                </span>
            </td>

            <td>
                <div class="nombre-producto">
                    <div class="producto-mini-icon">
                        <i class="fa-solid fa-flask"></i>
                    </div>

                    <strong>${producto.nombre}</strong>
                </div>
            </td>

            <td>
                <span class="categoria-producto">
                    ${producto.categoria || ""}
                </span>
            </td>

            <td>${producto.marca || ""}</td>

            <td>
                <strong class="precio-producto">
                    $${Number(producto.precio).toLocaleString("es-CO")}
                </strong>
            </td>

            <td>
                <div class="stock-numero">
                    <strong>${stockActual}</strong>
                    ${estadoStock}
                </div>
            </td>

            <td>${stockMinimo}</td>

            <td>${estadoProducto}</td>

            <td>
                <div class="acciones-producto">
                    <button
                        class="btn-accion btn-editar"
                        onclick="editarProducto(${producto.id})"
                        title="Editar producto">

                        <i class="fa-solid fa-pen"></i>
                    </button>

                    <button
                        class="btn-accion btn-eliminar"
                        onclick="eliminarProducto(${producto.id})"
                        title="Eliminar producto">

                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

    tabla.appendChild(fila);
  });
}

// ==========================================
// GUARDAR Y ACTUALIZAR PRODUCTOS
// ==========================================

formulario.addEventListener("submit", async function (event) {
  event.preventDefault();

  const producto = {
    codigo: document.getElementById("codigo").value.trim(),

    nombre: document.getElementById("nombre").value.trim(),

    categoria: document.getElementById("categoria").value,

    marca: document.getElementById("marca").value.trim(),

    precio: Number(document.getElementById("precio").value),

    stock: Number(document.getElementById("stock").value),

    stockMinimo: Number(document.getElementById("stockMinimo").value),

    estado: document.getElementById("estado").value,
  };

  // Validaciones
  if (!producto.codigo || !producto.nombre) {
    alert("El código y el nombre son obligatorios.");
    return;
  }

  if (producto.precio < 0) {
    alert("El precio no puede ser negativo.");
    return;
  }

  if (producto.stock < 0 || producto.stockMinimo < 0) {
    alert("El stock no puede ser negativo.");
    return;
  }

  try {
    let respuesta;

    // Actualizar producto
    if (idEditando !== null) {
      respuesta = await fetch(`${API_URL}/${idEditando}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(producto),
      });
    }

    // Registrar producto nuevo
    else {
      respuesta = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(producto),
      });
    }

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo guardar el producto.");
    }

    if (idEditando !== null) {
      alert("Producto actualizado correctamente.");
    } else {
      alert("Producto registrado correctamente.");
    }

    // Restablecer formulario
    formulario.reset();

    idEditando = null;

    // Volver a consultar MySQL
    await cargarProductos();
  } catch (error) {
    console.error("Error al guardar:", error);

    alert(error.message);
  }
});

// ==========================================
// EDITAR PRODUCTO
// ==========================================

function editarProducto(id) {
  const producto = productos.find(function (elemento) {
    return elemento.id === id;
  });

  if (!producto) {
    alert("No se encontró el producto.");
    return;
  }

  document.getElementById("codigo").value = producto.codigo;

  document.getElementById("nombre").value = producto.nombre;

  document.getElementById("categoria").value = producto.categoria;

  document.getElementById("marca").value = producto.marca || "";

  document.getElementById("precio").value = producto.precio;

  document.getElementById("stock").value = producto.stock;

  document.getElementById("stockMinimo").value = producto.stockMinimo;

  document.getElementById("estado").value = producto.estado;

  // Guardar ID para actualizar
  idEditando = producto.id;

  // Subir al formulario
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// ==========================================
// ELIMINAR PRODUCTO
// ==========================================

async function eliminarProducto(id) {
  const confirmar = confirm("¿Está seguro de eliminar este producto?");

  if (!confirmar) {
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo eliminar el producto.");
    }

    alert("Producto eliminado correctamente.");

    await cargarProductos();
  } catch (error) {
    console.error("Error al eliminar:", error);

    alert(error.message);
  }
}

// ==========================================
// BUSCADOR
// ==========================================

if (buscador) {
  buscador.addEventListener("input", function () {
    const texto = buscador.value.toLowerCase().trim();

    const productosFiltrados = productos.filter(function (producto) {
      return (
        String(producto.codigo).toLowerCase().includes(texto) ||
        String(producto.nombre).toLowerCase().includes(texto) ||
        String(producto.categoria || "")
          .toLowerCase()
          .includes(texto) ||
        String(producto.marca || "")
          .toLowerCase()
          .includes(texto)
      );
    });

    mostrarProductos(productosFiltrados);
  });
}

// ==========================================
// CARGAR AL ABRIR LA PÁGINA
// ==========================================

cargarProductos();
