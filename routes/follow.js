'use strict'

var express = require('express'); // cargamos express
var FollowController = require('../controllers/follow'); // cargamos controlador follow
var api = express.Router(); // cargamos metodo Router
var md_auth = require('../middlewares/authenticated'); // cargamos el middleware de autentificación

// con get obtenemos el directorio /pruebas, utilizamos metodo token md_auth 
//y utilizamos el controlador FollowController con la función prueba
api.post('/follow', md_auth.ensureAuth, FollowController.saveFollow);
// creamos ruta para dejar de seguir 
api.delete('/follow/:id', md_auth.ensureAuth, FollowController.deleteFollow);
// creamos ruta para listar los usuarios seguidos
api.get('/following/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowingUsers);
// creamos ruta para listar los usuarios que nos siguen
api.get('/followed/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowedUsers);
// creamos ruta para listar los usuarios que seguimos y nos siguen 
api.get('/get-my-follows/:followed?', md_auth.ensureAuth, FollowController.getMyFollows);


// exportar todas las rutas
module.exports = api;