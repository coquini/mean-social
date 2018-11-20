'use strict'

var express = require('express');
var UserController = require('../controllers/user');

// para tener acceso a los metodos get, put, post etc...
var api = express.Router();

var md_auth = require('../middlewares/authenticated');

// cargamos multiparty en un middleware, si lleva dos middleware hay que ponerlos con un array con []

var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/users'});

// rutas

api.get('/home', UserController.home);
api.get('/pruebas', md_auth.ensureAuth, UserController.pruebas);
api.post('/register', UserController.saveUser);
api.post('/login', UserController.loginUser);
api.get('/user/:id', md_auth.ensureAuth, UserController.getUser);
api.get('/users/:page?', md_auth.ensureAuth, UserController.getUsers);
api.get('/counters/:id?', md_auth.ensureAuth, UserController.getCounters);
api.put('/update-user/:id', md_auth.ensureAuth, UserController.updateUser);
api.post('/upload-image-user/:id', [md_auth.ensureAuth, md_upload], UserController.uploadImage);
api.get('/get-image-user/:imageFile', UserController.getImageFile);


module.exports = api;