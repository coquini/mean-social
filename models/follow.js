'use strict'
// creacion en mongodb de la collección follows, aunque aquí se crea con Follow(mongodb cambia de Follow a follows)
var mongoose = require('mongoose');

var Schema = mongoose.Schema;
// user y followed se obtiene del nombre de la entidad User
var FollowSchema = Schema({
	user: { type: Schema.ObjectId, ref:'User' },
	followed: { type:Schema.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Follow', FollowSchema);