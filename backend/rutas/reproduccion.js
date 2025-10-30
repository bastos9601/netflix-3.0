// Rutas de reproducción:
// Gestiona el progreso de visualización (leer y guardar).
const express = require('express');
const router = express.Router();
const repCtrl = require('../controladores/reproduccion');
const { verificarToken } = require('../middlewares/autenticacion');

router.get('/progreso', verificarToken, repCtrl.obtenerProgreso);
router.post('/progreso', verificarToken, repCtrl.guardarProgreso);

module.exports = router;