'use strict'

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// user se obtiene del nombre de la entidad User
var PublicationSchema = Schema({
	text: String,
	file: String,
	created_at: String,
	user: { type: Schema.ObjectId, ref: 'User' }

});
// se guarda en la base de datos como publications
module.exports = mongoose.model('Publication', PublicationSchema);

