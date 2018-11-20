'use strict'
// cargamos plugins que vamos a usar
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');
// Cargamos modelos o entidades
var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/message');


function probando(req, res) {
	res.status(200).send({message: 'Funcionando el módulo controller de messages'});
}
// Enviar mensajes
function saveMessage(req, res) {
	var params = req.body;

	if(!params.text || !params.receiver) return res.status(500).send({message: 'Envía los datos necesarios'});

	var message = new Message();

	message.emitter = req.user.sub;
	message.receiver = params.receiver;
	message.text = params.text;
	message.created_at = moment().unix();
	message.viewed = 'false';

	message.save((err, messageStored) => {
		if(err) return res.status(500).send({message: 'Error en la petición api'});

		if(!messageStored) res.status(500).send({message: 'Error al guardar el mensaje'});

		return res.status(200).send({message: messageStored});

	});
}
// obtener los mensajes recibidos de un usuario logueado userId 
function getReceivedMessages(req, res) {
	var userId = req.user.sub;

	var page = 1;

	if(req.params.page){
		page = req.params.page;
	}

	var itemsPerPage = 4;
    // populate para que nos devuelva datos del (emitter)con el segundo parametro ('name surname _id nick image') 
    //le indicamos solos los campos que devuelve
	Message.find({receiver: userId}).populate('emitter', 'name surname _id nick image').sort('-created_at').paginate(page, itemsPerPage, (err, messages, total) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});

		if(!messages) return res.status(404).send({message: 'No hay mensajes'});

		return res.status(200).send({
			total: total,
			pages: Math.ceil(total/itemsPerPage),
			messages
			
		});
	});
}
// obtener los mensajes enviados
function getEmmitMessages(req, res) {
	var userId = req.user.sub;

	var page = 1;

	if(req.params.page){
		page = req.params.page;
	}

	var itemsPerPage = 4;

	Message.find({emitter: userId}).populate('emitter receiver', 'name surname _id nick image').sort('-created_at').paginate(page, itemsPerPage, (err,messages, total) => {

		if(err) return res.status(500).send({message: 'Error en la petición'});

		if(!messages) return res.status(404).send({message: 'No has enviado ningún mensaje'});

		return res.status(200).send({
			total: total,
			pages: Math.ceil(total/itemsPerPage),
			messages
		});
	});
}
// obtener mensajes no leidos del usuario logueado
function getUnviewedMessages(req, res) {
	var userId = req.user.sub;
    
    Message.countDocuments({receiver: userId, viewed: 'false'}).exec((err, countDocuments) => {
    	if(err) return res.status(500).send({message: 'Error en la petición'});

    	//if(countDocuments <= 0) return res.status(404).send({message: 'No tienes ningún mensaje sin leer'});

    	return res.status(200).send({
    		'unviewed': countDocuments
    	});

    });

}
// marcar mensajes como leídos, con "multi" actualizamos todos los documentos
function setViewedMessages(req, res) {
	var userId = req.user.sub;

	Message.update({receiver: userId, viewed: 'false'}, {viewed: 'true'}, {"multi": true}, (err, messageUdpated) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});

		return res.status(200).send({
			messages: messageUdpated
		});
	});
}

module.exports = {
	probando,
	saveMessage,
	getReceivedMessages,
	getEmmitMessages,
	getUnviewedMessages,
	setViewedMessages,

};
