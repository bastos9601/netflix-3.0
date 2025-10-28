const express = require('express');
const router = express.Router();
const perfilesCtrl = require('../controladores/perfiles');
const { verificarToken } = require('../middlewares/autenticacion');

router.get('/', verificarToken, perfilesCtrl.listarPerfiles);
router.post('/', verificarToken, perfilesCtrl.crearPerfil);
router.put('/:id', verificarToken, perfilesCtrl.actualizarPerfil);
router.delete('/:id', verificarToken, perfilesCtrl.eliminarPerfil);

module.exports = router;