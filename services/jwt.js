'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_curso_desarrolar_red_social_angular'; // clave secreta para codificar datos jwt.encode

// creamos la funcion createToken y recibimos en un función el user
exports.createToken = function (user) {
	// objeto con las propiedades que se quieren enviar en el token
	var payload = {
		sub: user._id, // el identificador de usuario
		name: user.name,
		surname: user.surname,
		nick: user.nick,
		email: user.email,
		role: user.role,
		image: user.image,
		iat: moment().unix(),// para la fecha con moment
		exp: moment().add(30, 'days').unix
	};

	return jwt.encode(payload, secret);

};