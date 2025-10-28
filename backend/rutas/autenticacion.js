const express = require('express');
const router = express.Router();
const authCtrl = require('../controladores/autenticacion');

router.post('/registro', authCtrl.registrar);
router.post('/ingreso', authCtrl.ingresar);

module.exports = router;