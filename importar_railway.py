import mysql.connector
from getpass import getpass

archivo = r"C:\Users\SENA\Downloads\agrogestion_correcta.sql.sql"
conexion = None

try:
    print("Conectando con MySQL de Railway...", flush=True)

    conexion = mysql.connector.connect(
        host="hayabusa.proxy.rlwy.net",
        port=40299,
        user="root",
        password=getpass("Escribe la contraseña de Railway: "),
        database="railway"
    )

    print("Conexion correcta.", flush=True)
    print("Leyendo archivo SQL...", flush=True)

    with open(archivo, "r", encoding="utf-8-sig") as f:
        contenido = f.read()

    print("Importando tablas y datos...", flush=True)

    for resultado in conexion.cmd_query_iter(contenido):
        pass

    conexion.commit()

    print("IMPORTACION FINALIZADA CORRECTAMENTE.", flush=True)

    cursor = conexion.cursor()
    cursor.execute("SHOW TABLES")
    tablas = cursor.fetchall()

    print("\nTablas encontradas en Railway:")
    for tabla in tablas:
        print("-", tabla[0])

    cursor.close()

except Exception as error:
    print("\nERROR:", error)

    if conexion and conexion.is_connected():
        conexion.rollback()

finally:
    if conexion and conexion.is_connected():
        conexion.close()
