const express = require('express');
const router = express.Router();
const calificacionesCtrl = require('../controladores/calificaciones');

// POST /calificaciones (body: perfil_id, contenido_id, tipo, estrellas)
router.post('/', calificacionesCtrl.guardarCalificacion);

// DELETE /calificaciones (body: perfil_id, contenido_id, tipo)
router.delete('/', calificacionesCtrl.eliminarCalificacion);

// GET /calificaciones/:perfil_id
router.get('/:perfil_id', calificacionesCtrl.obtenerCalificaciones);

module.exports = router;
