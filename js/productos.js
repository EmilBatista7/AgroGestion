// ==========================================
// PRODUCTOS - AGROGESTIÓN
// ==========================================

// Obtener productos guardados en LocalStorage
let productos = JSON.parse(localStorage.getItem("productos")) || [];

let lotes = JSON.parse(localStorage.getItem("lotes")) || [];
// Formulario
const formulario = document.getElementById("formProducto");

// Tabla
const tabla = document.getElementById("tablaProductos");

// Buscador
const buscador = document.getElementById("buscarProducto");

// Índice del producto que se está editando
let indiceEditando = -1;

// ==========================================
// SINCRONIZAR STOCK CON LOS LOTES
// ==========================================

function sincronizarStockConLotes() {
  productos.forEach(function (producto) {
    const lotesProducto = lotes.filter(function (lote) {
      return (
        String(lote.productoCodigo).trim() === String(producto.codigo).trim()
      );
    });

    // Si el producto tiene lotes,
    // el stock será la suma de sus cantidades

    if (lotesProducto.length > 0) {
      let stockTotal = 0;

      lotesProducto.forEach(function (lote) {
        stockTotal += Number(lote.cantidad) || 0;
      });

      producto.stock = stockTotal;
    }
  });

  // Guardar el stock actualizado

  localStorage.setItem("productos", JSON.stringify(productos));
}

// ==========================================
// MOSTRAR PRODUCTOS
// ==========================================

function mostrarProductos(lista = productos) {
  tabla.innerHTML = "";

  // Si no hay productos
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

  // Recorrer productos
  lista.forEach(function (producto) {
    // Buscar índice real del producto
    const indice = productos.indexOf(producto);

    const fila = document.createElement("tr");

    // ==================================
    // ESTADO DEL STOCK
    // ==================================

    // ==================================
    // ESTADO DEL STOCK
    // ==================================

    const stockActual = Number(producto.stock) || 0;
    const stockMinimo = Number(producto.stockMinimo) || 0;

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

    // ==================================
    // ESTADO DEL PRODUCTO
    // ==================================

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

    // ==================================
    // FILA
    // ==================================

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

                    <strong>
                        ${producto.nombre}
                    </strong>

                </div>

            </td>


            <td>
                <span class="categoria-producto">
                    ${producto.categoria}
                </span>
            </td>


            <td>
                ${producto.marca}
            </td>


            <td>

                <strong class="precio-producto">
                    $${Number(producto.precio).toLocaleString("es-CO")}
                </strong>

            </td>


            <td>

                <div class="stock-numero">

                    <strong>
                        ${producto.stock}
                    </strong>

                    ${estadoStock}

                </div>

            </td>


            <td>
                ${producto.stockMinimo}
            </td>


            <td>
                ${estadoProducto}
            </td>


            <td>

                <div class="acciones-producto">

                    <button
                        class="btn-accion btn-editar"
                        onclick="editarProducto(${indice})"
                        title="Editar producto">

                        <i class="fa-solid fa-pen"></i>

                    </button>


                    <button
                        class="btn-accion btn-eliminar"
                        onclick="eliminarProducto(${indice})"
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
// GUARDAR PRODUCTO
// ==========================================

formulario.addEventListener("submit", function (event) {
  event.preventDefault();

  // Obtener información
  const codigo = document.getElementById("codigo").value.trim();

  const nombre = document.getElementById("nombre").value.trim();

  const categoria = document.getElementById("categoria").value;

  const marca = document.getElementById("marca").value.trim();

  const precio = Number(document.getElementById("precio").value);

  const stock = Number(document.getElementById("stock").value);

  const stockMinimo = Number(document.getElementById("stockMinimo").value);

  const estado = document.getElementById("estado").value;

  // ==================================
  // VALIDACIONES
  // ==================================

  if (precio < 0) {
    alert("El precio no puede ser negativo.");

    return;
  }

  if (stock < 0 || stockMinimo < 0) {
    alert("El stock no puede ser negativo.");

    return;
  }

  // Código repetido
  const codigoRepetido = productos.some(function (producto, indice) {
    return (
      producto.codigo.toLowerCase() === codigo.toLowerCase() &&
      indice !== indiceEditando
    );
  });

  if (codigoRepetido) {
    alert("Ya existe un producto con ese código.");

    return;
  }

  // ==================================
  // CREAR PRODUCTO
  // ==================================

  const producto = {
    codigo: codigo,

    nombre: nombre,

    categoria: categoria,

    marca: marca,

    precio: precio,

    stock: stock,

    stockMinimo: stockMinimo,

    estado: estado,
  };

  // ==================================
  // EDITAR
  // ==================================

  if (indiceEditando !== -1) {
    productos[indiceEditando] = producto;

    alert("Producto actualizado correctamente.");

    indiceEditando = -1;
  }

  // ==================================
  // NUEVO PRODUCTO
  // ==================================
  else {
    productos.push(producto);

    alert("Producto registrado correctamente.");
  }

  // Guardar
  localStorage.setItem("productos", JSON.stringify(productos));

  // Limpiar formulario
  formulario.reset();

  // Mostrar tabla
  mostrarProductos();
});

// ==========================================
// EDITAR PRODUCTO
// ==========================================

function editarProducto(indice) {
  const producto = productos[indice];

  document.getElementById("codigo").value = producto.codigo;

  document.getElementById("nombre").value = producto.nombre;

  document.getElementById("categoria").value = producto.categoria;

  document.getElementById("marca").value = producto.marca;

  document.getElementById("precio").value = producto.precio;

  document.getElementById("stock").value = producto.stock;

  document.getElementById("stockMinimo").value = producto.stockMinimo;

  document.getElementById("estado").value = producto.estado;

  // Guardar índice
  indiceEditando = indice;

  // Subir al formulario
  window.scrollTo({
    top: 0,

    behavior: "smooth",
  });
}

// ==========================================
// ELIMINAR PRODUCTO
// ==========================================

function eliminarProducto(indice) {
  const confirmar = confirm("¿Está seguro de eliminar este producto?");

  if (confirmar) {
    productos.splice(indice, 1);

    localStorage.setItem("productos", JSON.stringify(productos));

    mostrarProductos();

    alert("Producto eliminado correctamente.");
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
        producto.codigo.toLowerCase().includes(texto) ||
        producto.nombre.toLowerCase().includes(texto) ||
        producto.categoria.toLowerCase().includes(texto) ||
        producto.marca.toLowerCase().includes(texto)
      );
    });

    mostrarProductos(productosFiltrados);
  });
}

// ==========================================
// MOSTRAR AL CARGAR
// ==========================================

sincronizarStockConLotes();

mostrarProductos();