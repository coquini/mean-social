// middleware para comprobar el token
'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'clave_secreta_curso_desarrolar_red_social_angular'; // clave secreta para codificar datos jwt.encode

// función para comprobar el token
exports.ensureAuth = function (req, res, next) {
	if(!req.headers.authorization){
		return res.status(403).send({message: 'La petición no tiene la cabecera de autentificación'});
	}
    // si responden ok se crea variable token y con replace sustituimos ' y " por nada para eliminarlos de la respuesta
	var token = req.headers.authorization.replace(/['"]+/g, '');

	try{
         // decoficar el token, se mete dentro del try & catch para capturar si hay una excepción 
         //y que no se quede parada la aplicación
	    var payload = jwt.decode(token, secret);
        // si la fecha es más antigua que el token error 401
	    if (payload.exp <= moment().unix()) {
	    	return res.status(401).send({
	    		message: 'El token ha expirado',
	    	});
	    }
	}catch(ex){
		return res.status(401).send({
			message: 'El token no es valido'
		});

	}
    // tenemos todos los datos recibidos en el token de la req
	req.user = payload;
    // ejecutamos la acción del controlador tercer argumento de ensureAuth
	next();
    
   
}