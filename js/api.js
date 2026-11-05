// ==========================================
// ENVIAR TOKEN DE AUTENTICACIÓN A FLASK
// ==========================================

const fetchOriginal = window.fetch.bind(window);

window.fetch = function (recurso, opciones = {}) {
  const url = typeof recurso === "string" ? recurso : recurso.url;

  const token = localStorage.getItem("token");

  // Solo agregar el token a las peticiones de AgroGestión
  if (url.includes("127.0.0.1:5001/api/") && token) {
    const encabezados = new Headers(opciones.headers || {});

    encabezados.set("Authorization", `Bearer ${token}`);

    opciones = {
      ...opciones,
      headers: encabezados,
    };
  }

  return fetchOriginal(recurso, opciones);
};
