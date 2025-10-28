const express = require('express');
const { obtenerMiLista, agregarAMiLista, quitarDeMiLista, verificarEnMiLista } = require('../controladores/miLista');
const { verificarToken } = require('../middlewares/autenticacion');

const router = express.Router();

// Obtener Mi Lista de un perfil
router.get('/:perfilId', verificarToken, obtenerMiLista);

// Verificar si un contenido está en Mi Lista
router.get('/:perfilId/verificar', verificarToken, verificarEnMiLista);

// Agregar contenido a Mi Lista
router.post('/:perfilId/agregar', verificarToken, agregarAMiLista);

// Quitar contenido de Mi Lista
router.delete('/:perfilId/quitar', verificarToken, quitarDeMiLista);

module.exports = router;