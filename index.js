'use strict'
//  ruta arrancar api cygdrive /c:/Users/Coquini/Documents/Master Javascript/curso-mean-social/api
// incluimos api/plugin mongoose para la conexión a la base de datos de mongodb
var mongoose = require('mongoose');

// importar app donde está express
var app = require('./app');

// puerto 
var port = 3800;

mongoose.Promise = global.Promise;

// conexión a la base de datos ( "useMongoClient:true" deprecated new => use "NewUrlParser:true")

mongoose.connect('mongodb://localhost:27017/curso-mean-social', {useNewUrlParser:true})
         .then(() =>{
         	console.log("La conexión a base de datos curso-mean-social se ha realizado satisfactoriamente")

         	// creación del servidor a la escucha en el puerto var port = 3800
         	app.listen(port, () =>{
         		console.log("Servidor corriendo en http://localhost:3800");
         	});
         })
         .catch(err => console.log(err));