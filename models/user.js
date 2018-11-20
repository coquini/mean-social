'use strict'
// creación del modelo usuario/users
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// definimos las propiedades del modelo usuario
var UserSchema = Schema({
	name: String,
	surname: String,
	nick: String,
	email: String,
	password: String,
	role: String,
	image: String,
});

// exportar modelo, nombre de la entidad User y su schema(formato) UserSchema, lo guarda como users en mongodb

module.exports = mongoose.model('User', UserSchema);