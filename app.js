'use strict'

// configurar express para las rutas

var express = require('express');

//covertir el body que se recibe en un objeto de javascript, se hace con un middleware body-parser.

var bodyParser = require('body-parser');

// llamamos a express

var app = express();

// para crear enlace backend con client en producción, también se incluye en rutas con el middleware app.use (app.use(express.static(path.join(__dirname, 'client')));)
var path = require('path');

// cargar rutas

var user_routes = require('./routes/user');
var follow_routes = require('./routes/follow');
var publication_routes = require('./routes/publication');
var message_routes = require('./routes/message');


// middlewares, es un metodo que se ejecuta antes de que llegue a un controlador, se ejecuta en cada petición.

app.use(bodyParser.urlencoded({extended:false}));
// se convierte a json
app.use(bodyParser.json());

// cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
 
    next();
});


// rutas base (crea el directorio de la web en http://localhost:3800/), las rutas se puede incluir los controladores 
// como user.js, aqui se añade a la ruta el directorio /api con el middleware app.use
app.use('/',express.static('client', {redirect:false})); 
app.use('/api', user_routes);
app.use('/api', follow_routes);
app.use('/api', publication_routes);
app.use('/api', message_routes);

// refrescar paginas en modo produccion para evitar error al realizar f5 a la web también hay que añadir (app.use('/',express.static('client', {redirect:false}));)
app.get('*', function (req, res, next) {
	res.sendFile(path.resolve('client/index.html'));
});

// exportar app

module.exports = app;