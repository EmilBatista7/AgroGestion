// ==========================================
// CONEXION DE AGROGESTION CON RAILWAY
// ==========================================

const API_LOCAL = "http://127.0.0.1:5001";
const API_RAILWAY = "https://agrogestion-production-36d5a971.up.railway.app";

const fetchOriginal = window.fetch.bind(window);

window.fetch = function (recurso, opciones = {}) {

    let url = typeof recurso === "string" ? recurso : recurso.url;

    // Redirigir las peticiones locales a Railway
    if (url.startsWith(API_LOCAL)) {
        url = url.replace(API_LOCAL, API_RAILWAY);

        if (recurso instanceof Request) {
            recurso = new Request(url, recurso);
        } else {
            recurso = url;
        }
    }

    // Obtener el token de autenticacion
    const token = localStorage.getItem("token");

    // Enviar el token a Railway
    if (url.startsWith(API_RAILWAY + "/api/") && token) {

        const encabezados = new Headers(
            recurso instanceof Request ? recurso.headers : {}
        );

        new Headers(opciones.headers || {}).forEach((valor, nombre) => {
            encabezados.set(nombre, valor);
        });

        encabezados.set("Authorization", `Bearer ${token}`);

        opciones = {
            ...opciones,
            headers: encabezados
        };
    }

    return fetchOriginal(recurso, opciones);
};
