from flask import Flask, jsonify, request
import mysql.connector
from mysql.connector import Error
from werkzeug.security import check_password_hash
from itsdangerous import URLSafeTimedSerializer
import os
from functools import wraps

app = Flask(__name__)


# ==========================================
# CONFIGURACIÓN DE SEGURIDAD
# ==========================================

app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY",
    "clave-desarrollo-agrogestion-cambiar-en-produccion"
)

# Crear herramienta para generar y verificar tokens
serializador = URLSafeTimedSerializer(
    app.config["SECRET_KEY"],
    salt="agrogestion-auth"
)


# ==========================================
# VERIFICAR TOKEN DEL USUARIO
# ==========================================

def requiere_autenticacion(funcion):

    @wraps(funcion)
    def decorada(*args, **kwargs):

        autorizacion = request.headers.get("Authorization", "")

        if not autorizacion.startswith("Bearer "):
            return jsonify({
                "error": "Debes iniciar sesión."
            }), 401

        token = autorizacion.split(" ", 1)[1]

        try:
            usuario = serializador.loads(
                token,
                max_age=28800
            )

            request.usuario = usuario

        except SignatureExpired:
            return jsonify({
                "error": "La sesión ha expirado. Inicia sesión nuevamente."
            }), 401

        except BadSignature:
            return jsonify({
                "error": "Token de sesión no válido."
            }), 401

        return funcion(*args, **kwargs)

    return decorada


# ==========================================
# VERIFICAR PERMISOS DE JEFE
# ==========================================

def requiere_rol(rol_requerido):

    def decorador(funcion):

        @wraps(funcion)
        @requiere_autenticacion
        def decorada(*args, **kwargs):

            if request.usuario.get("rol") != rol_requerido:
                return jsonify({
                    "error": "No tienes permisos para realizar esta operación."
                }), 403

            return funcion(*args, **kwargs)

        return decorada

    return decorador


# ==========================================
# CONEXIÓN CON MYSQL
# ==========================================

def conectar_bd():
    try:
        conexion = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="agrogestion"
        )
        return conexion

    except Error as error:
        print("Error al conectar con MySQL:", error)
        return None


# ==========================================
# PERMITIR COMUNICACIÓN CON EL FRONTEND
# ==========================================

@app.after_request
def permitir_cors(respuesta):
    respuesta.headers["Access-Control-Allow-Origin"] = "*"
    respuesta.headers["Access-Control-Allow-Headers"] = (
    "Content-Type, Authorization"
)
    respuesta.headers["Access-Control-Allow-Methods"] = (
        "GET, POST, PUT, DELETE, OPTIONS"
    )
    return respuesta


# ==========================================
# VERIFICAR TOKEN DE AUTENTICACIÓN
# ==========================================

def requiere_token(funcion):

    @wraps(funcion)
    def decorador(*args, **kwargs):

        autorizacion = request.headers.get("Authorization")

        if not autorizacion or not autorizacion.startswith("Bearer "):
            return jsonify({
                "mensaje": "No estás autorizado. Debes iniciar sesión."
            }), 401

        token = autorizacion.split(" ", 1)[1]

        try:
            datos_token = URLSafeTimedSerializer(
                app.config["SECRET_KEY"]
            ).loads(token, max_age=28800)

            request.usuario = datos_token

        except Exception:
            return jsonify({
                "mensaje": "El token es inválido o ha expirado."
            }), 401

        return funcion(*args, **kwargs)

    return decorador



# ==========================================
# VERIFICAR PERMISOS SEGÚN EL ROL
# ==========================================

def requiere_rol(*roles_permitidos):

    def decorador(funcion):

        @wraps(funcion)
        def verificar_permiso(*args, **kwargs):

            rol = request.usuario.get("rol")

            if rol not in roles_permitidos:
                return jsonify({
                    "mensaje": "No tienes permisos para realizar esta operación."
                }), 403

            return funcion(*args, **kwargs)

        return verificar_permiso

    return decorador



# ==========================================
# COMPROBAR CONEXIÓN
# ==========================================

@app.route("/api/estado", methods=["GET"])
def estado():
    conexion = conectar_bd()

    if conexion is None:
        return jsonify({
            "mensaje": "No fue posible conectar con MySQL"
        }), 500

    cursor = None

    try:
        cursor = conexion.cursor()
        cursor.execute("SELECT COUNT(*) FROM productos")
        resultado = cursor.fetchone()

        return jsonify({
            "mensaje": "Conexión correcta con AgroGestión",
            "base_datos": "agrogestion",
            "total_productos": resultado[0]
        })

    except Error as error:
        return jsonify({"error": str(error)}), 500

    finally:
        if cursor:
            cursor.close()
        conexion.close()


# ==========================================
# CONSULTAR PRODUCTOS
# ==========================================

@app.route("/api/productos", methods=["GET"])
@requiere_token
@requiere_rol("jefe", "empleado")
def listar_productos():
    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No hay conexión con MySQL"}), 500

    cursor = None

    try:
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                codigo,
                nombre,
                categoria,
                marca,
                precio,
                stock,
                stock_minimo AS stockMinimo,
                estado
            FROM productos
            ORDER BY id DESC
        """)

        productos = cursor.fetchall()

        return jsonify(productos)

    except Error as error:
        return jsonify({"error": str(error)}), 500

    finally:
        if cursor:
            cursor.close()
        conexion.close()


# ==========================================
# REGISTRAR PRODUCTO
# ==========================================

@app.route("/api/productos", methods=["POST"])
@requiere_token
@requiere_rol("jefe", "empleado")
def registrar_producto():
    datos = request.get_json(silent=True)

    if not datos:
        return jsonify({"error": "No se recibieron datos"}), 400

    codigo = str(datos.get("codigo", "")).strip()
    nombre = str(datos.get("nombre", "")).strip()
    categoria = str(datos.get("categoria", "")).strip()
    marca = str(datos.get("marca", "")).strip()
    estado = datos.get("estado", "Activo")

    if not codigo or not nombre:
        return jsonify({
            "error": "El código y el nombre son obligatorios"
        }), 400

    if estado not in ["Activo", "Inactivo"]:
        return jsonify({"error": "Estado no válido"}), 400

    try:
        precio = float(datos.get("precio", 0))
        stock = int(datos.get("stock", 0))
        stock_minimo = int(datos.get("stockMinimo", datos.get("stock_minimo", 0)))

        if precio < 0 or stock < 0 or stock_minimo < 0:
            return jsonify({
                "error": "El precio y el stock no pueden ser negativos"
            }), 400

    except (ValueError, TypeError):
        return jsonify({
            "error": "Precio y stock deben ser valores numéricos válidos"
        }), 400

    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No hay conexión con MySQL"}), 500

    cursor = None

    try:
        cursor = conexion.cursor()

        consulta = """
            INSERT INTO productos
            (codigo, nombre, categoria, marca, precio,
             stock, stock_minimo, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """

        valores = (
            codigo,
            nombre,
            categoria,
            marca,
            precio,
            stock,
            stock_minimo,
            estado
        )

        cursor.execute(consulta, valores)
        conexion.commit()

        return jsonify({
            "mensaje": "Producto registrado correctamente",
            "id": cursor.lastrowid
        }), 201

    except Error as error:
        conexion.rollback()

        if error.errno == 1062:
            return jsonify({
                "error": "Ya existe un producto con ese código"
            }), 409

        print("Error al registrar producto:", error)
        return jsonify({"error": "No se pudo registrar el producto"}), 500

    finally:
        if cursor:
            cursor.close()
        conexion.close()


# ==========================================
# ACTUALIZAR PRODUCTO
# ==========================================

@app.route("/api/productos/<int:id>", methods=["PUT"])
@requiere_token
@requiere_rol("jefe")
def actualizar_producto(id):
    datos = request.get_json(silent=True)

    if not datos:
        return jsonify({"error": "No se recibieron datos"}), 400

    codigo = str(datos.get("codigo", "")).strip()
    nombre = str(datos.get("nombre", "")).strip()
    categoria = str(datos.get("categoria", "")).strip()
    marca = str(datos.get("marca", "")).strip()
    estado = datos.get("estado", "Activo")

    if not codigo or not nombre:
        return jsonify({
            "error": "El código y el nombre son obligatorios"
        }), 400

    if estado not in ["Activo", "Inactivo"]:
        return jsonify({"error": "Estado no válido"}), 400

    try:
        precio = float(datos.get("precio", 0))
        stock = int(datos.get("stock", 0))
        stock_minimo = int(datos.get("stockMinimo", datos.get("stock_minimo", 0)))

        if precio < 0 or stock < 0 or stock_minimo < 0:
            return jsonify({
                "error": "El precio y el stock no pueden ser negativos"
            }), 400

    except (ValueError, TypeError):
        return jsonify({
            "error": "Precio y stock deben ser valores numéricos válidos"
        }), 400

    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No hay conexión con MySQL"}), 500

    cursor = None

    try:
        cursor = conexion.cursor()

        consulta = """
            UPDATE productos
            SET codigo = %s,
                nombre = %s,
                categoria = %s,
                marca = %s,
                precio = %s,
                stock = %s,
                stock_minimo = %s,
                estado = %s
            WHERE id = %s
        """

        valores = (
            codigo,
            nombre,
            categoria,
            marca,
            precio,
            stock,
            stock_minimo,
            estado,
            id
        )

        cursor.execute(consulta, valores)

        if cursor.rowcount == 0:
            cursor.execute(
                "SELECT id FROM productos WHERE id = %s",
                (id,)
            )

            if cursor.fetchone() is None:
                return jsonify({
                    "error": "El producto no existe"
                }), 404

        conexion.commit()

        return jsonify({
            "mensaje": "Producto actualizado correctamente"
        })

    except Error as error:
        conexion.rollback()

        if error.errno == 1062:
            return jsonify({
                "error": "Ya existe otro producto con ese código"
            }), 409

        print("Error al actualizar producto:", error)
        return jsonify({"error": "No se pudo actualizar el producto"}), 500

    finally:
        if cursor:
            cursor.close()
        conexion.close()


# ==========================================
# ELIMINAR PRODUCTO
# ==========================================

@app.route("/api/productos/<int:id>", methods=["DELETE"])
@requiere_token
@requiere_rol("jefe")
def eliminar_producto(id):
    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No hay conexión con MySQL"}), 500

    cursor = None

    try:
        cursor = conexion.cursor()

        cursor.execute(
            "DELETE FROM productos WHERE id = %s",
            (id,)
        )

        if cursor.rowcount == 0:
            return jsonify({
                "error": "El producto no existe"
            }), 404

        conexion.commit()

        return jsonify({
            "mensaje": "Producto eliminado correctamente"
        })

    except Error as error:
        conexion.rollback()

        if error.errno == 1451:
            return jsonify({
                "error": (
                    "No se puede eliminar este producto porque "
                    "está relacionado con lotes, ventas o movimientos "
                    "de inventario."
                )
            }), 409

        print("Error al eliminar producto:", error)
        return jsonify({"error": "No se pudo eliminar el producto"}), 500

    finally:
        if cursor:
            cursor.close()
        conexion.close()


# ==========================================
# INICIAR SERVIDOR
# ==========================================




# ==========================================
# API DE CLIENTES
# ==========================================

@app.route("/api/clientes", methods=["GET"])
@requiere_token
@requiere_rol("jefe", "empleado")
def obtener_clientes():
    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con MySQL"}), 500

    try:
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, documento, nombre, telefono, correo,
                direccion, tipo, estado
            FROM clientes
            ORDER BY id DESC
        """)

        clientes = cursor.fetchall()

        return jsonify(clientes), 200

    except Error as error:
        return jsonify({"error": str(error)}), 500

    finally:
        conexion.close()


@app.route("/api/clientes", methods=["POST"])
@requiere_token
@requiere_rol("jefe", "empleado")
def registrar_cliente():
    datos = request.get_json()

    if not datos:
        return jsonify({"error": "No se recibieron datos"}), 400

    documento = datos.get("documento", "").strip()
    nombre = datos.get("nombre", "").strip()
    telefono = datos.get("telefono", "").strip()
    correo = datos.get("correo", "").strip()
    direccion = datos.get("direccion", "").strip()
    tipo = datos.get("tipo", "").strip()
    estado = datos.get("estado", "Activo").strip()

    if not all([documento, nombre, telefono, correo,
                direccion, tipo, estado]):
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    if tipo not in ["Particular", "Empresa", "Productor"]:
        return jsonify({"error": "Tipo de cliente no válido"}), 400

    if estado not in ["Activo", "Inactivo"]:
        return jsonify({"error": "Estado no válido"}), 400

    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con MySQL"}), 500

    try:
        cursor = conexion.cursor()

        cursor.execute("""
            INSERT INTO clientes
            (documento, nombre, telefono, correo, direccion, tipo, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (documento, nombre, telefono, correo,
            direccion, tipo, estado))

        conexion.commit()

        return jsonify({
            "mensaje": "Cliente registrado correctamente",
            "id": cursor.lastrowid
        }), 201

    except Error as error:
        conexion.rollback()

        if error.errno == 1062:
            return jsonify({
                "error": "Ya existe un cliente con ese documento"
            }), 409

        return jsonify({"error": str(error)}), 500

    finally:
        conexion.close()


@app.route("/api/clientes/<int:id>", methods=["PUT"])
@requiere_token
@requiere_rol("jefe", "empleado")
def actualizar_cliente(id):
    datos = request.get_json()

    if not datos:
        return jsonify({"error": "No se recibieron datos"}), 400

    documento = datos.get("documento", "").strip()
    nombre = datos.get("nombre", "").strip()
    telefono = datos.get("telefono", "").strip()
    correo = datos.get("correo", "").strip()
    direccion = datos.get("direccion", "").strip()
    tipo = datos.get("tipo", "").strip()
    estado = datos.get("estado", "").strip()

    if not all([documento, nombre, telefono, correo,
                direccion, tipo, estado]):
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    if tipo not in ["Particular", "Empresa", "Productor"]:
        return jsonify({"error": "Tipo de cliente no válido"}), 400

    if estado not in ["Activo", "Inactivo"]:
        return jsonify({"error": "Estado no válido"}), 400

    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con MySQL"}), 500

    try:
        cursor = conexion.cursor()

        cursor.execute("""
            UPDATE clientes
            SET documento = %s,
                nombre = %s,
                telefono = %s,
                correo = %s,
                direccion = %s,
                tipo = %s,
                estado = %s
            WHERE id = %s
        """, (documento, nombre, telefono, correo,
            direccion, tipo, estado, id))

        if cursor.rowcount == 0:
            cursor.execute(
                "SELECT id FROM clientes WHERE id = %s", (id,)
            )

            if cursor.fetchone() is None:
                return jsonify({"error": "Cliente no encontrado"}), 404

        conexion.commit()

        return jsonify({
            "mensaje": "Cliente actualizado correctamente"
        }), 200

    except Error as error:
        conexion.rollback()

        if error.errno == 1062:
            return jsonify({
                "error": "Ya existe otro cliente con ese documento"
            }), 409

        return jsonify({"error": str(error)}), 500

    finally:
        conexion.close()


# ==========================================
# API DE CLIENTES
# ==========================================

@app.route("/api/clientes/<int:id>", methods=["DELETE"])
@requiere_token
@requiere_rol("jefe", "empleado")
def eliminar_cliente(id):
    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con MySQL"}), 500

    try:
        cursor = conexion.cursor()

        cursor.execute(
            "DELETE FROM clientes WHERE id = %s", (id,)
        )

        if cursor.rowcount == 0:
            return jsonify({"error": "Cliente no encontrado"}), 404

        conexion.commit()

        return jsonify({
            "mensaje": "Cliente eliminado correctamente"
        }), 200

    except Error as error:
        conexion.rollback()

        if error.errno == 1451:
            return jsonify({
                "error": "No se puede eliminar este cliente porque tiene ventas relacionadas"
            }), 409

        return jsonify({"error": str(error)}), 500

    finally:
        conexion.close()




# ==========================================
# API DE PROVEEDORES
# ==========================================

# CONSULTAR PROVEEDORES

@app.route("/api/proveedores", methods=["GET"])
@requiere_token
@requiere_rol("jefe", "empleado")
def obtener_proveedores():
    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con MySQL"}), 500

    cursor = None

    try:
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                documento AS nit,
                nombre AS empresa,
                contacto,
                telefono,
                correo,
                direccion,
                estado
            FROM proveedores
            ORDER BY id DESC
        """)

        proveedores = cursor.fetchall()

        return jsonify(proveedores), 200

    except Error as error:
        print("Error al consultar proveedores:", error)
        return jsonify({"error": "No se pudieron consultar los proveedores"}), 500

    finally:
        if cursor:
            cursor.close()
        conexion.close()


# REGISTRAR PROVEEDOR

@app.route("/api/proveedores", methods=["POST"])
@requiere_token
@requiere_rol("jefe")
def registrar_proveedor():
    datos = request.get_json(silent=True)

    if not datos:
        return jsonify({"error": "No se recibieron datos"}), 400

    nit = str(datos.get("nit", "")).strip()
    empresa = str(datos.get("empresa", "")).strip()
    contacto = str(datos.get("contacto", "")).strip()
    telefono = str(datos.get("telefono", "")).strip()
    correo = str(datos.get("correo", "")).strip()
    direccion = str(datos.get("direccion", "")).strip()
    estado = str(datos.get("estado", "Activo")).strip()

    if not all([nit, empresa, contacto, telefono, correo, direccion]):
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    if estado not in ["Activo", "Inactivo"]:
        return jsonify({"error": "Estado no válido"}), 400

    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con MySQL"}), 500

    cursor = None

    try:
        cursor = conexion.cursor()

        cursor.execute("""
            INSERT INTO proveedores
            (documento, nombre, contacto, telefono, correo, direccion, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (nit, empresa, contacto, telefono, correo, direccion, estado))

        conexion.commit()

        return jsonify({
            "mensaje": "Proveedor registrado correctamente",
            "id": cursor.lastrowid
        }), 201

    except Error as error:
        conexion.rollback()

        if error.errno == 1062:
            return jsonify({
                "error": "Ya existe un proveedor con ese NIT"
            }), 409

        print("Error al registrar proveedor:", error)
        return jsonify({"error": "No se pudo registrar el proveedor"}), 500

    finally:
        if cursor:
            cursor.close()
        conexion.close()


# ACTUALIZAR PROVEEDOR

@app.route("/api/proveedores/<int:id>", methods=["PUT"])
@requiere_token
@requiere_rol("jefe")
def actualizar_proveedor(id):
    datos = request.get_json(silent=True)

    if not datos:
        return jsonify({"error": "No se recibieron datos"}), 400

    nit = str(datos.get("nit", "")).strip()
    empresa = str(datos.get("empresa", "")).strip()
    contacto = str(datos.get("contacto", "")).strip()
    telefono = str(datos.get("telefono", "")).strip()
    correo = str(datos.get("correo", "")).strip()
    direccion = str(datos.get("direccion", "")).strip()
    estado = str(datos.get("estado", "")).strip()

    if not all([nit, empresa, contacto, telefono, correo, direccion]):
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    if estado not in ["Activo", "Inactivo"]:
        return jsonify({"error": "Estado no válido"}), 400

    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con MySQL"}), 500

    cursor = None

    try:
        cursor = conexion.cursor()

        cursor.execute("""
            UPDATE proveedores
            SET documento = %s,
                nombre = %s,
                contacto = %s,
                telefono = %s,
                correo = %s,
                direccion = %s,
                estado = %s
            WHERE id = %s
        """, (nit, empresa, contacto, telefono, correo,
            direccion, estado, id))

        if cursor.rowcount == 0:
            cursor.execute(
                "SELECT id FROM proveedores WHERE id = %s",
                (id,)
            )

            if cursor.fetchone() is None:
                return jsonify({"error": "Proveedor no encontrado"}), 404

        conexion.commit()

        return jsonify({
            "mensaje": "Proveedor actualizado correctamente"
        }), 200

    except Error as error:
        conexion.rollback()

        if error.errno == 1062:
            return jsonify({
                "error": "Ya existe otro proveedor con ese NIT"
            }), 409

        print("Error al actualizar proveedor:", error)
        return jsonify({"error": "No se pudo actualizar el proveedor"}), 500

    finally:
        if cursor:
            cursor.close()
        conexion.close()


# ELIMINAR PROVEEDOR

@app.route("/api/proveedores/<int:id>", methods=["DELETE"])
@requiere_token
@requiere_rol("jefe")
def eliminar_proveedor(id):
    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con MySQL"}), 500

    cursor = None

    try:
        cursor = conexion.cursor()

        cursor.execute(
            "DELETE FROM proveedores WHERE id = %s",
            (id,)
        )

        if cursor.rowcount == 0:
            return jsonify({"error": "Proveedor no encontrado"}), 404

        conexion.commit()

        return jsonify({
            "mensaje": "Proveedor eliminado correctamente"
        }), 200

    except Error as error:
        conexion.rollback()

        if error.errno == 1451:
            return jsonify({
                "error": "No se puede eliminar este proveedor porque tiene registros relacionados"
            }), 409

        print("Error al eliminar proveedor:", error)
        return jsonify({"error": "No se pudo eliminar el proveedor"}), 500

    finally:
        if cursor:
            cursor.close()
        conexion.close()



# ==========================================
# CRUD LOTES
# ==========================================

# CONSULTAR LOTES
@app.route("/api/lotes", methods=["GET"])
@requiere_token
@requiere_rol("jefe", "empleado")
def obtener_lotes():
    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con la base de datos"}), 500

    try:
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                l.id,
                l.producto_codigo AS productoCodigo,
                p.nombre AS producto,
                l.numero_lote AS numeroLote,
                l.fecha_fabricacion AS fechaFabricacion,
                l.fecha_vencimiento AS fechaVencimiento,
                l.cantidad,
                l.estado
            FROM lotes l
            INNER JOIN productos p
                ON l.producto_codigo = p.codigo
            ORDER BY l.id DESC
        """)

        lotes = cursor.fetchall()

        for lote in lotes:
            lote["fechaFabricacion"] = (
                lote["fechaFabricacion"].isoformat()
                if lote["fechaFabricacion"] else None
            )
            lote["fechaVencimiento"] = (
                lote["fechaVencimiento"].isoformat()
                if lote["fechaVencimiento"] else None
            )

        return jsonify(lotes), 200

    except Error as error:
        return jsonify({"error": str(error)}), 500

    finally:
        cursor.close()
        conexion.close()


# REGISTRAR LOTE
@app.route("/api/lotes", methods=["POST"])
@requiere_token
@requiere_rol("jefe", "empleado")
def registrar_lote():
    datos = request.get_json()

    if not datos:
        return jsonify({"error": "No se recibieron datos"}), 400

    producto_codigo = datos.get("productoCodigo")
    numero_lote = datos.get("numeroLote", "").strip()
    fecha_fabricacion = datos.get("fechaFabricacion")
    fecha_vencimiento = datos.get("fechaVencimiento")
    cantidad = datos.get("cantidad")
    estado = datos.get("estado", "Disponible")

    if not all([
        producto_codigo,
        numero_lote,
        fecha_fabricacion,
        fecha_vencimiento,
        cantidad is not None
    ]):
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    try:
        cantidad = int(cantidad)

        if cantidad <= 0:
            return jsonify({"error": "La cantidad debe ser mayor que cero"}), 400

        if fecha_vencimiento <= fecha_fabricacion:
            return jsonify({
                "error": "La fecha de vencimiento debe ser posterior a la fabricación"
            }), 400

        if estado not in ["Disponible", "Bloqueado"]:
            return jsonify({"error": "El estado seleccionado no es válido"}), 400

    except (ValueError, TypeError):
        return jsonify({"error": "La cantidad debe ser un número entero válido"}), 400

    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con la base de datos"}), 500

    try:
        cursor = conexion.cursor()

        # Verificar que el producto exista
        cursor.execute(
            "SELECT codigo FROM productos WHERE codigo = %s",
            (producto_codigo,)
        )

        if cursor.fetchone() is None:
            return jsonify({"error": "El producto seleccionado no existe"}), 404

        cursor.execute("""
            INSERT INTO lotes (
                producto_codigo,
                numero_lote,
                fecha_fabricacion,
                fecha_vencimiento,
                cantidad,
                estado
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            producto_codigo,
            numero_lote,
            fecha_fabricacion,
            fecha_vencimiento,
            cantidad,
            estado
        ))

        conexion.commit()

        return jsonify({"mensaje": "Lote registrado correctamente"}), 201

    except Error as error:
        conexion.rollback()

        if error.errno == 1062:
            return jsonify({"error": "Ya existe un lote con ese número"}), 409

        return jsonify({"error": str(error)}), 500

    finally:
        cursor.close()
        conexion.close()


# ELIMINAR LOTE
@app.route("/api/lotes/<int:id>", methods=["DELETE"])
@requiere_token
@requiere_rol("jefe")
def eliminar_lote(id):
    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con la base de datos"}), 500

    try:
        cursor = conexion.cursor()

        cursor.execute("DELETE FROM lotes WHERE id = %s", (id,))

        if cursor.rowcount == 0:
            return jsonify({"error": "El lote no existe"}), 404

        conexion.commit()

        return jsonify({"mensaje": "Lote eliminado correctamente"}), 200

    except Error as error:
        conexion.rollback()

        if error.errno == 1451:
            return jsonify({
                "error": "No se puede eliminar este lote porque tiene movimientos o ventas relacionados."
            }), 409

        return jsonify({"error": str(error)}), 500

    finally:
        cursor.close()
        conexion.close()



# ==========================================
# INVENTARIO Y MOVIMIENTOS
# ==========================================

# CONSULTAR HISTORIAL DE MOVIMIENTOS
@app.route("/api/movimientos-inventario", methods=["GET"])
@requiere_token
@requiere_rol("jefe", "empleado")
def obtener_movimientos_inventario():
    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con la base de datos"}), 500

    cursor = None

    try:
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                m.id,
                m.producto_codigo AS productoCodigo,
                p.nombre AS producto,
                l.numero_lote AS lote,
                m.tipo,
                m.cantidad,
                m.fecha,
                m.observacion
            FROM movimientos_inventario m
            INNER JOIN productos p
                ON m.producto_codigo = p.codigo
            LEFT JOIN lotes l
                ON m.lote_id = l.id
            ORDER BY m.fecha DESC, m.id DESC
        """)

        movimientos = cursor.fetchall()

        for movimiento in movimientos:
            if movimiento["fecha"]:
                movimiento["fecha"] = movimiento["fecha"].strftime("%d/%m/%Y %H:%M")

        return jsonify(movimientos), 200

    except Error as error:
        return jsonify({"error": str(error)}), 500

    finally:
        if cursor:
            cursor.close()
        conexion.close()


# REGISTRAR ENTRADA O SALIDA
@app.route("/api/movimientos-inventario", methods=["POST"])
@requiere_token
@requiere_rol("jefe", "empleado")
def registrar_movimiento_inventario():
    datos = request.get_json()

    if not datos:
        return jsonify({"error": "No se recibieron datos"}), 400

    producto_codigo = datos.get("productoCodigo")
    lote_id = datos.get("loteId")
    tipo = datos.get("tipo")
    cantidad = datos.get("cantidad")
    usuario_id = datos.get("usuarioId")
    observacion = datos.get("observacion")

    if not producto_codigo or not lote_id or not tipo or cantidad is None:
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    try:
        lote_id = int(lote_id)
        cantidad = int(cantidad)

        if lote_id <= 0 or cantidad <= 0:
            return jsonify({"error": "El lote y la cantidad deben ser válidos"}), 400

        if tipo not in ["Entrada", "Salida"]:
            return jsonify({"error": "El tipo de movimiento no es válido"}), 400

        if usuario_id in ["", None]:
            usuario_id = None
        else:
            usuario_id = int(usuario_id)

    except (ValueError, TypeError):
        return jsonify({"error": "Los datos numéricos no son válidos"}), 400

    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con la base de datos"}), 500

    cursor = None

    try:
        cursor = conexion.cursor(dictionary=True)

        # Iniciar transacción
        conexion.start_transaction()

        # Buscar y bloquear el lote seleccionado
        cursor.execute("""
            SELECT id, producto_codigo, cantidad
            FROM lotes
            WHERE id = %s
            FOR UPDATE
        """, (lote_id,))

        lote = cursor.fetchone()

        if not lote:
            conexion.rollback()
            return jsonify({"error": "El lote seleccionado no existe"}), 404

        if lote["producto_codigo"] != producto_codigo:
            conexion.rollback()
            return jsonify({"error": "El lote no pertenece al producto seleccionado"}), 400

        cantidad_actual = int(lote["cantidad"])

        # Validar y calcular la nueva cantidad
        if tipo == "Salida":
            if cantidad > cantidad_actual:
                conexion.rollback()
                return jsonify({
                    "error": "No hay suficiente cantidad disponible en el lote seleccionado"
                }), 400

            nueva_cantidad = cantidad_actual - cantidad

        else:
            nueva_cantidad = cantidad_actual + cantidad

        # Actualizar cantidad y estado del lote
        nuevo_estado = "Disponible" if nueva_cantidad > 0 else "Agotado"

        cursor.execute("""
            UPDATE lotes
            SET cantidad = %s, estado = %s
            WHERE id = %s
        """, (nueva_cantidad, nuevo_estado, lote_id))

        # Recalcular stock general del producto
        cursor.execute("""
            SELECT COALESCE(SUM(cantidad), 0) AS stock_total
            FROM lotes
            WHERE producto_codigo = %s
        """, (producto_codigo,))

        resultado_stock = cursor.fetchone()
        stock_total = int(resultado_stock["stock_total"])

        cursor.execute("""
            UPDATE productos
            SET stock = %s
            WHERE codigo = %s
        """, (stock_total, producto_codigo))

        # Registrar historial
        cursor.execute("""
            INSERT INTO movimientos_inventario (
                producto_codigo,
                lote_id,
                usuario_id,
                tipo,
                cantidad,
                observacion
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            producto_codigo,
            lote_id,
            usuario_id,
            tipo,
            cantidad,
            observacion
        ))

        # Confirmar todas las operaciones
        conexion.commit()

        return jsonify({
            "mensaje": "Movimiento registrado correctamente",
            "stockActual": stock_total,
            "cantidadLote": nueva_cantidad
        }), 201

    except Error as error:
        conexion.rollback()
        return jsonify({"error": str(error)}), 500

    finally:
        if cursor:
            cursor.close()
        conexion.close()




# ==========================================
# API DE VENTAS
# ==========================================

# CONSULTAR HISTORIAL DE VENTAS

@app.route("/api/ventas", methods=["GET"])
@requiere_token
@requiere_rol("jefe", "empleado")
def obtener_ventas():
    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con MySQL"}), 500

    cursor = None

    try:
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                v.id,
                v.fecha,
                v.cliente_id AS clienteId,
                COALESCE(c.nombre, 'Cliente no registrado') AS cliente,
                v.total,
                v.metodo_pago AS metodoPago,
                v.estado
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            ORDER BY v.fecha DESC, v.id DESC
        """)

        ventas = cursor.fetchall()

        for venta in ventas:
            if venta["fecha"]:
                venta["fecha"] = venta["fecha"].strftime("%d/%m/%Y %H:%M")

            venta["total"] = float(venta["total"])

        return jsonify(ventas), 200

    except Error as error:
        print("Error al consultar ventas:", error)
        return jsonify({"error": "No se pudo consultar el historial"}), 500

    finally:
        if cursor:
            cursor.close()
        conexion.close()


# CONSULTAR DETALLE DE UNA VENTA

@app.route("/api/ventas/<int:id>", methods=["GET"])
@requiere_token
@requiere_rol("jefe", "empleado")
def obtener_detalle_venta(id):
    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con MySQL"}), 500

    cursor = None

    try:
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                v.id,
                v.fecha,
                v.total,
                v.metodo_pago AS metodoPago,
                v.estado,
                c.nombre AS cliente,
                c.documento AS documentoCliente,
                c.telefono AS telefonoCliente,
                c.correo AS correoCliente,
                c.direccion AS direccionCliente
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            WHERE v.id = %s
        """, (id,))

        venta = cursor.fetchone()

        if not venta:
            return jsonify({"error": "La venta no existe"}), 404

        cursor.execute("""
            SELECT
                d.id,
                d.producto_codigo AS productoCodigo,
                p.nombre AS producto,
                d.lote_id AS loteId,
                l.numero_lote AS numeroLote,
                d.cantidad,
                d.cantidad_devuelta AS cantidadDevuelta,
                d.precio,
                d.subtotal
            FROM detalle_ventas d
            INNER JOIN productos p
                ON d.producto_codigo = p.codigo
            LEFT JOIN lotes l
                ON d.lote_id = l.id
            WHERE d.venta_id = %s
            ORDER BY d.id
        """, (id,))

        detalles = cursor.fetchall()

        if venta["fecha"]:
            venta["fecha"] = venta["fecha"].strftime("%d/%m/%Y %H:%M")

        venta["total"] = float(venta["total"])

        for detalle in detalles:
            detalle["precio"] = float(detalle["precio"])
            detalle["subtotal"] = float(detalle["subtotal"])

        venta["productos"] = detalles

        return jsonify(venta), 200

    except Error as error:
        print("Error al consultar detalle de venta:", error)
        return jsonify({"error": "No se pudo consultar el detalle"}), 500

    finally:
        if cursor:
            cursor.close()
        conexion.close()


# REGISTRAR UNA VENTA

@app.route("/api/ventas", methods=["POST"])
@requiere_token
@requiere_rol("jefe", "empleado")
def registrar_venta():
    datos = request.get_json(silent=True)

    if not datos:
        return jsonify({"error": "No se recibieron datos"}), 400

    cliente_id = datos.get("clienteId")
    metodo_pago = datos.get("metodoPago")
    productos = datos.get("productos")

    if not cliente_id or not metodo_pago or not productos:
        return jsonify({
            "error": "Debe seleccionar un cliente, un método de pago y productos"
        }), 400

    if metodo_pago not in ["Efectivo", "Transferencia", "Tarjeta"]:
        return jsonify({"error": "El método de pago no es válido"}), 400

    if not isinstance(productos, list):
        return jsonify({"error": "Los productos enviados no son válidos"}), 400

    try:
        cliente_id = int(cliente_id)

        if cliente_id <= 0:
            raise ValueError()

        for item in productos:
            cantidad = int(item.get("cantidad", 0))
            lote_id = int(item.get("loteId", 0))

            if cantidad <= 0 or lote_id <= 0:
                raise ValueError()

            if not item.get("productoCodigo"):
                raise ValueError()

    except (ValueError, TypeError, AttributeError):
        return jsonify({
            "error": "Los datos de los productos no son válidos"
        }), 400

    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con MySQL"}), 500

    cursor = None

    try:
        cursor = conexion.cursor(dictionary=True)
        conexion.start_transaction()

        # Verificar que el cliente exista y esté activo
        cursor.execute("""
            SELECT id, nombre
            FROM clientes
            WHERE id = %s AND estado = 'Activo'
            FOR UPDATE
        """, (cliente_id,))

        cliente = cursor.fetchone()

        if not cliente:
            conexion.rollback()
            return jsonify({
                "error": "El cliente no existe o está inactivo"
            }), 400

        total = 0
        detalles = []

        # Validar productos y lotes, y calcular los valores
        for item in productos:
            producto_codigo = str(item["productoCodigo"]).strip()
            lote_id = int(item["loteId"])
            cantidad = int(item["cantidad"])

            # Bloquear y consultar el producto
            cursor.execute("""
                SELECT codigo, nombre, precio, estado
                FROM productos
                WHERE codigo = %s
                FOR UPDATE
            """, (producto_codigo,))

            producto = cursor.fetchone()

            if not producto or producto["estado"] != "Activo":
                conexion.rollback()
                return jsonify({
                    "error": "Uno de los productos no existe o está inactivo"
                }), 400

            # Bloquear y consultar el lote
            cursor.execute("""
                SELECT
                    id,
                    producto_codigo,
                    cantidad,
                    estado,
                    fecha_vencimiento
                FROM lotes
                WHERE id = %s
                FOR UPDATE
            """, (lote_id,))

            lote = cursor.fetchone()

            if not lote:
                conexion.rollback()
                return jsonify({
                    "error": "Uno de los lotes seleccionados no existe"
                }), 400

            if lote["producto_codigo"] != producto_codigo:
                conexion.rollback()
                return jsonify({
                    "error": "El lote no pertenece al producto seleccionado"
                }), 400

            if lote["estado"] != "Disponible":
                conexion.rollback()
                return jsonify({
                    "error": "Uno de los lotes no está disponible"
                }), 400

            if lote["fecha_vencimiento"] < __import__("datetime").date.today():
                conexion.rollback()
                return jsonify({
                    "error": "No se puede vender un producto vencido"
                }), 400

            if cantidad > int(lote["cantidad"]):
                conexion.rollback()
                return jsonify({
                    "error": (
                        "No hay suficiente existencia en el lote de "
                        + producto["nombre"]
                    )
                }), 400

            # El precio se obtiene de MySQL, no del navegador
            precio = float(producto["precio"])
            subtotal = round(precio * cantidad, 2)

            total += subtotal

            detalles.append({
                "productoCodigo": producto_codigo,
                "producto": producto["nombre"],
                "loteId": lote_id,
                "cantidad": cantidad,
                "precio": precio,
                "subtotal": subtotal
            })

        total = round(total, 2)

        # Obtener usuario de la sesión, si se envía
        usuario_id = datos.get("usuarioId")

        if usuario_id in ["", None]:
            usuario_id = None
        else:
            usuario_id = int(usuario_id)

            cursor.execute(
                "SELECT id FROM usuarios WHERE id = %s",
                (usuario_id,)
            )

            if cursor.fetchone() is None:
                conexion.rollback()
                return jsonify({"error": "El usuario no existe"}), 400

        # Crear el encabezado de la venta
        cursor.execute("""
            INSERT INTO ventas (
                cliente_id,
                usuario_id,
                total,
                metodo_pago,
                estado
            )
            VALUES (%s, %s, %s, %s, 'Completada')
        """, (cliente_id, usuario_id, total, metodo_pago))

        venta_id = cursor.lastrowid

        # Guardar detalles y descontar existencias
        for detalle in detalles:
            cursor.execute("""
                INSERT INTO detalle_ventas (
                    venta_id,
                    producto_codigo,
                    lote_id,
                    cantidad,
                    precio,
                    subtotal
                )
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                venta_id,
                detalle["productoCodigo"],
                detalle["loteId"],
                detalle["cantidad"],
                detalle["precio"],
                detalle["subtotal"]
            ))

            # Descontar del lote
            cursor.execute("""
                UPDATE lotes
                SET cantidad = cantidad - %s,
                    estado = CASE
                        WHEN cantidad - %s <= 0 THEN 'Agotado'
                        ELSE 'Disponible'
                    END
                WHERE id = %s
            """, (
                detalle["cantidad"],
                detalle["cantidad"],
                detalle["loteId"]
            ))

            # Recalcular el stock general
            cursor.execute("""
                SELECT COALESCE(SUM(cantidad), 0) AS stock_total
                FROM lotes
                WHERE producto_codigo = %s
            """, (detalle["productoCodigo"],))

            stock_total = cursor.fetchone()["stock_total"]

            cursor.execute("""
                UPDATE productos
                SET stock = %s
                WHERE codigo = %s
            """, (stock_total, detalle["productoCodigo"]))

            # Registrar salida en el historial de inventario
            cursor.execute("""
                INSERT INTO movimientos_inventario (
                    producto_codigo,
                    lote_id,
                    usuario_id,
                    tipo,
                    cantidad,
                    observacion
                )
                VALUES (%s, %s, %s, 'Salida', %s, %s)
            """, (
                detalle["productoCodigo"],
                detalle["loteId"],
                usuario_id,
                detalle["cantidad"],
                "Venta #" + str(venta_id)
            ))

        # Registrar ingreso en caja
        cursor.execute("""
            INSERT INTO movimientos_caja (
                usuario_id,
                tipo,
                concepto,
                valor
            )
            VALUES (%s, 'Ingreso', %s, %s)
        """, (
            usuario_id,
            "Venta #" + str(venta_id) + " - " + cliente["nombre"],
            total
        ))

        conexion.commit()

        return jsonify({
            "mensaje": "Venta registrada correctamente",
            "ventaId": venta_id,
            "total": total
        }), 201

    except (Error, ValueError, TypeError) as error:
        conexion.rollback()
        print("Error al registrar venta:", error)
        return jsonify({
            "error": "No se pudo registrar la venta. Verifique los datos."
        }), 500

    finally:
        if cursor:
            cursor.close()
        conexion.close()


# ==========================================
# REGISTRAR DEVOLUCIÓN DE UNA VENTA
# ==========================================

@app.route("/api/ventas/<int:id>/devoluciones", methods=["POST"])
@requiere_token
@requiere_rol("jefe", "empleado")
def registrar_devolucion(id):
    datos = request.get_json(silent=True)

    if not datos:
        return jsonify({"error": "No se recibieron datos"}), 400

    try:
        detalle_id = int(datos.get("detalleId", 0))
        cantidad = int(datos.get("cantidad", 0))

        if detalle_id <= 0 or cantidad <= 0:
            raise ValueError()

    except (ValueError, TypeError):
        return jsonify({
            "error": "El detalle y la cantidad deben ser válidos"
        }), 400

    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con MySQL"}), 500

    cursor = None

    try:
        cursor = conexion.cursor(dictionary=True)
        conexion.start_transaction()

        # Bloquear el detalle de la venta
        cursor.execute("""
            SELECT
                d.id,
                d.producto_codigo,
                d.lote_id,
                d.cantidad,
                d.cantidad_devuelta,
                d.precio,
                v.id AS venta_id
            FROM detalle_ventas d
            INNER JOIN ventas v ON d.venta_id = v.id
            WHERE d.id = %s AND v.id = %s
            FOR UPDATE
        """, (detalle_id, id))

        detalle = cursor.fetchone()

        if not detalle:
            conexion.rollback()
            return jsonify({
                "error": "No se encontró el producto en esta venta"
            }), 404

        cantidad_pendiente = (
            int(detalle["cantidad"]) -
            int(detalle["cantidad_devuelta"])
        )

        if cantidad > cantidad_pendiente:
            conexion.rollback()
            return jsonify({
                "error": (
                    "La cantidad supera las unidades que todavía "
                    "se pueden devolver"
                )
            }), 400

        lote_id = detalle["lote_id"]

        if lote_id is None:
            conexion.rollback()
            return jsonify({
                "error": "El producto no tiene un lote asociado para devolver"
            }), 400

        # Bloquear el lote que recibirá las unidades
        cursor.execute("""
            SELECT id, cantidad
            FROM lotes
            WHERE id = %s
            FOR UPDATE
        """, (lote_id,))

        lote = cursor.fetchone()

        if not lote:
            conexion.rollback()
            return jsonify({
                "error": "No se encontró el lote de esta venta"
            }), 400

        nueva_cantidad = int(lote["cantidad"]) + cantidad

        # Recuperar las unidades en el lote
        cursor.execute("""
            UPDATE lotes
            SET cantidad = %s,
                estado = 'Disponible'
            WHERE id = %s
        """, (nueva_cantidad, lote_id))

        # Actualizar el acumulado de devoluciones
        nueva_cantidad_devuelta = (
            int(detalle["cantidad_devuelta"]) + cantidad
        )

        cursor.execute("""
            UPDATE detalle_ventas
            SET cantidad_devuelta = %s
            WHERE id = %s
        """, (nueva_cantidad_devuelta, detalle_id))

        # Recalcular el stock general
        cursor.execute("""
            SELECT COALESCE(SUM(cantidad), 0) AS stock_total
            FROM lotes
            WHERE producto_codigo = %s
        """, (detalle["producto_codigo"],))

        stock_total = cursor.fetchone()["stock_total"]

        cursor.execute("""
            UPDATE productos
            SET stock = %s
            WHERE codigo = %s
        """, (stock_total, detalle["producto_codigo"]))

        # Registrar entrada en inventario
        cursor.execute("""
            INSERT INTO movimientos_inventario (
                producto_codigo,
                lote_id,
                usuario_id,
                tipo,
                cantidad,
                observacion
            )
            VALUES (%s, %s, NULL, 'Entrada', %s, %s)
        """, (
            detalle["producto_codigo"],
            lote_id,
            cantidad,
            "Devolución de venta #" + str(id)
        ))

        # Calcular el dinero que se devuelve
        valor_devolucion = round(
            float(detalle["precio"]) * cantidad,
            2
        )

        # Registrar egreso en caja
        cursor.execute("""
            INSERT INTO movimientos_caja (
                usuario_id,
                tipo,
                concepto,
                valor
            )
            VALUES (NULL, 'Egreso', %s, %s)
        """, (
            "Devolución de venta #" + str(id),
            valor_devolucion
        ))

        # Comprobar si todos los productos fueron devueltos
        cursor.execute("""
            SELECT
                SUM(cantidad) AS total_vendido,
                SUM(cantidad_devuelta) AS total_devuelto
            FROM detalle_ventas
            WHERE venta_id = %s
        """, (id,))

        resumen = cursor.fetchone()

        if int(resumen["total_vendido"]) == int(resumen["total_devuelto"]):
            cursor.execute("""
                UPDATE ventas
                SET estado = 'Devuelta'
                WHERE id = %s
            """, (id,))
        else:
            cursor.execute("""
                UPDATE ventas
                SET estado = 'Devolución parcial'
                WHERE id = %s
            """, (id,))

        conexion.commit()

        return jsonify({
            "mensaje": "Devolución registrada correctamente",
            "cantidadDevuelta": cantidad,
            "valorDevuelto": valor_devolucion,
            "stockActual": stock_total
        }), 201

    except (Error, ValueError, TypeError) as error:
        conexion.rollback()
        print("Error al registrar devolución:", error)
        return jsonify({
            "error": "No se pudo registrar la devolución"
        }), 500

    finally:
        if cursor:
            cursor.close()
        conexion.close()


# ==========================================
# CAJA - CONSULTAR MOVIMIENTOS
# ==========================================

@app.route("/api/movimientos-caja", methods=["GET"])
@requiere_token
@requiere_rol("jefe", "empleado")
def obtener_movimientos_caja():
    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con la base de datos"}), 500

    cursor = None

    try:
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, tipo, concepto, valor, fecha
            FROM movimientos_caja
            ORDER BY fecha DESC, id DESC
        """)

        movimientos = cursor.fetchall()

        resultado = []

        for movimiento in movimientos:
            resultado.append({
                "id": movimiento["id"],
                "tipo": movimiento["tipo"],
                "concepto": movimiento["concepto"],
                "valor": float(movimiento["valor"]),
                "fecha": movimiento["fecha"].strftime("%d/%m/%Y %H:%M")
            })

        return jsonify(resultado)

    except Error as error:
        print("Error al consultar movimientos de caja:", error)
        return jsonify({"error": "Error al consultar los movimientos"}), 500

    finally:
        if cursor:
            cursor.close()
        conexion.close()


# ==========================================
# CAJA - REGISTRAR MOVIMIENTO MANUAL
# ==========================================

@app.route("/api/movimientos-caja", methods=["POST"])
@requiere_token
@requiere_rol("jefe")
def registrar_movimiento_caja():
    datos = request.get_json()

    if not datos:
        return jsonify({"error": "No se recibieron datos"}), 400

    tipo = datos.get("tipo")
    concepto = datos.get("concepto", "").strip()
    valor = datos.get("valor")

    if tipo not in ["Ingreso", "Egreso"]:
        return jsonify({"error": "Tipo de movimiento no válido"}), 400

    if not concepto:
        return jsonify({"error": "El concepto es obligatorio"}), 400

    try:
        valor = float(valor)

        if valor <= 0:
            return jsonify({"error": "El valor debe ser mayor que cero"}), 400

    except (TypeError, ValueError):
        return jsonify({"error": "El valor ingresado no es válido"}), 400

    conexion = conectar_bd()

    if conexion is None:
        return jsonify({"error": "No se pudo conectar con la base de datos"}), 500

    cursor = None

    try:
        cursor = conexion.cursor()

        cursor.execute("""
            INSERT INTO movimientos_caja
            (tipo, concepto, valor)
            VALUES (%s, %s, %s)
        """, (tipo, concepto, valor))

        conexion.commit()

        return jsonify({
            "mensaje": "Movimiento registrado correctamente",
            "id": cursor.lastrowid
        }), 201

    except Error as error:
        conexion.rollback()
        print("Error al registrar movimiento de caja:", error)
        return jsonify({"error": "No se pudo registrar el movimiento"}), 500

    finally:
        if cursor:
            cursor.close()
        conexion.close()





@app.route("/api/login", methods=["POST"])
def iniciar_sesion():
    datos = request.get_json(silent=True) or {}

    usuario = datos.get("usuario", "").strip()
    contrasena = datos.get("contrasena", "")

    if not usuario or not contrasena:
        return jsonify({
            "mensaje": "Debes ingresar usuario y contraseña."
        }), 400

    conexion = conectar_bd()

    if conexion is None:
        return jsonify({
            "mensaje": "No fue posible conectar con la base de datos."
        }), 500

    cursor = None

    try:
        cursor = conexion.cursor()

        cursor.execute("""
            SELECT id, nombre, usuario, clave, rol, estado
            FROM usuarios
            WHERE usuario = %s
        """, (usuario,))

        resultado = cursor.fetchone()

        if resultado is None:
            return jsonify({
                "mensaje": "Usuario o contraseña incorrectos."
            }), 401

        id_usuario, nombre, usuario_db, clave_hash, rol, estado = resultado

        if estado != "Activo":
            return jsonify({
                "mensaje": "Este usuario se encuentra inactivo."
            }), 403

        if not check_password_hash(clave_hash, contrasena):
            return jsonify({
                "mensaje": "Usuario o contraseña incorrectos."
            }), 401

                # Generar token de autenticación
        token = serializador.dumps({
            "id": id_usuario,
            "usuario": usuario_db,
            "rol": rol
        })

        token = URLSafeTimedSerializer(
    app.config["SECRET_KEY"]
).dumps({
    "id": id_usuario,
    "usuario": usuario_db,
    "rol": rol
})
        
        return jsonify({
            "mensaje": "Inicio de sesión correcto.",
            "token": token,
            "usuario": {
                "id": id_usuario,
                "nombre": nombre,
                "usuario": usuario_db,
                "rol": rol
            }
        }), 200

    except Error as error:
        print("Error en el inicio de sesión:", error)

        return jsonify({
            "mensaje": "Ocurrió un error al iniciar sesión."
        }), 500

    finally:
        if cursor:
            cursor.close()

        conexion.close()




if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5001,
        debug=True
    )


app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY",
    "4efed7af1f037b0d8a655d2e5230545507bb5f24dbc8cb1b2009a60837b7352c"
)