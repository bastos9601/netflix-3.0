// Servicio de almacenamiento (demo):
// Guarda y obtiene progreso en memoria (Map), no persistente.
const memoria = new Map();

export async function guardarProgreso(clave, segundo) {
  memoria.set(clave, segundo);
}

export async function obtenerProgreso(clave) {
  return memoria.get(clave) || 0;
}