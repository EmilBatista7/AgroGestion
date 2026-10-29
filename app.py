
from flask import Flask, jsonify, request
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)

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


@app.route("/api/estado", methods=["GET"])
def estado():
    conexion = conectar_bd()

    if conexion is None:
        return jsonify({
            "mensaje": "No fue posible conectar con MySQL"
        }), 500

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
        if conexion.is_connected():
            cursor.close()
            conexion.close()
            
            

@app.route("/api/productos", methods=["GET"])
def listar_productos():
    conexion = conectar_bd()

    if conexion is None:
        return jsonify({
            "mensaje": "No fue posible conectar con MySQL"
        }), 500

    cursor = None

    try:
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, codigo, nombre, categoria,
                precio, stock, stock_minimo
            FROM productos
            ORDER BY id DESC
        """)

        productos = cursor.fetchall()

        return jsonify(productos)

    except Error as error:
        return jsonify({"error": str(error)}), 500

    finally:
        if cursor is not None:
            cursor.close()

        conexion.close()
            



@app.route("/api/productos", methods=["POST"])
def registrar_producto():
    datos = request.get_json(silent=True)

    if not datos:
        return jsonify({
            "error": "Debes enviar los datos del producto en formato JSON"
        }), 400

    codigo = datos.get("codigo")
    nombre = datos.get("nombre")
    categoria = datos.get("categoria", "")
    precio = datos.get("precio", 0)
    stock = datos.get("stock", 0)
    stock_minimo = datos.get("stock_minimo", 5)

    if not codigo or not nombre:
        return jsonify({
            "error": "El código y el nombre son obligatorios"
        }), 400

    conexion = conectar_bd()

    if conexion is None:
        return jsonify({
            "error": "No fue posible conectar con MySQL"
        }), 500

    cursor = None

    try:
        cursor = conexion.cursor()

        consulta = """
            INSERT INTO productos
            (codigo, nombre, categoria, precio, stock, stock_minimo)
            VALUES (%s, %s, %s, %s, %s, %s)
        """

        valores = (
            codigo, nombre, categoria,
            precio, stock, stock_minimo
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

        return jsonify({
            "error": "No se pudo registrar el producto"
        }), 500

    finally:
        if cursor is not None:
            cursor.close()

        conexion.close()




if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
