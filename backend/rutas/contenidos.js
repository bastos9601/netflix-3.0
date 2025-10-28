const express = require('express');
const router = express.Router();
const contenidosCtrl = require('../controladores/contenidos');

// GET /contenidos/populares?tipo=movie|tv|all&periodo=day|week
router.get('/populares', contenidosCtrl.obtenerPopulares);

// GET /contenidos/buscar?q=texto&tipo=multi|movie|tv
router.get('/buscar', contenidosCtrl.buscarContenidos);

// GET /contenidos/:tipo/:id/videos
router.get('/:tipo/:id/videos', contenidosCtrl.obtenerVideosContenido);

// Series (TV)
// GET /contenidos/tv/:id
router.get('/tv/:id', contenidosCtrl.obtenerDetallesSerie);

// GET /contenidos/tv/:id/temporada/:numero
router.get('/tv/:id/temporada/:numero', contenidosCtrl.obtenerEpisodiosTemporada);

// GET /contenidos/tv/:id/creditos
router.get('/tv/:id/creditos', contenidosCtrl.obtenerCreditosTV);

// Fuentes locales (películas/series desde JSON)
// GET /contenidos/local/pelicula?titulo=...&anio=...
router.get('/local/pelicula', contenidosCtrl.obtenerFuentePeliculaLocal);

// GET /contenidos/local/serie?nombre=...&temporada=...&episodio=...
router.get('/local/serie', contenidosCtrl.obtenerFuenteSerieLocal);

module.exports = router;