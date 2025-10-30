// Rutas de autenticación:
// Define endpoints para registro, ingreso (login), login con código
// y recuperación/restablecimiento de contraseña.
const express = require('express');
const router = express.Router();
const authCtrl = require('../controladores/autenticacion');

router.post('/registro', authCtrl.registrar);
router.post('/ingreso', authCtrl.ingresar);

// Login con código (passwordless)
router.post('/codigo/solicitar', authCtrl.solicitarCodigo);
router.post('/codigo/ingresar', authCtrl.ingresarConCodigo);

// Recuperación de contraseña
router.post('/clave/solicitar-reset', authCtrl.solicitarReset);
router.post('/clave/restablecer', authCtrl.restablecerClave);

module.exports = router;