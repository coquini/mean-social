'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');


function probando(req, res) {
	res.status(200).send({
		message: 'Hola desde el controlador de publicaciones'
	});
}

function savePublication(req, res) {
	var params = req.body;

	if(!params.text) return status(200).send({message: 'Debes enviar algún mensaje'});

	var publication = new Publication();
	publication.text = params.text;
	publication.file = 'null';
	publication.user = req.user.sub;
	publication.created_at = moment().unix();

	// guardar en la base de datos
	publication.save((err, publicationStored) => {
		if(err) return res.status(500).send({message: 'Error al guardar la publicación'});

		if(!publicationStored) return res.status(404).send({message: 'No se ha podido guardar la publicación'});

		return res.status(200).send({publication: publicationStored});
	});
}

// obtener todas las publicaciones de los usuarios que sigo

function getPublications(req, res) {
	// obtemos el numero de paginas
	var page = 1;
	if(req.params.page){
		page = req.params.page;
	}
    // asignamos numero de publicaciones por pagina 
	var itemsPerPage = 4;

	// obtemos el listado de todos los usuarios que seguimos follows

	Follow.find({user: req.user.sub}).populate('followed').exec((err, follows) => {
		if(err) return res.status(500).send({message: 'Error al devolver el seguimiento'});

		var follows_clean = [];

		follows.forEach((follow) => {
			follows_clean.push(follow.followed);
			
		});
		console.log(follows_clean);
		// obtener publicaciones de los que nos siguen, in busca la coincidencias dentro de un array
		// sort ordenamos publicaciones de más nuevas a más viejas, populate para obtener todos los datos, 

		Publication.find({user: {"$in": follows_clean}}).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) => {
			if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});

			if(!publications) return res.status(404).send({message: 'No hay publicaciones'});
			//console.log(publications);

			return res.status(200).send({ 
				total_items: total,
				pages: Math.ceil(total/itemsPerPage),
				page: page,
				publications,
			});
		});


	});
}

function getPublication(req, res) {
	var publicationId = req.params.id;

	Publication.findById(publicationId, (err, publication) => {
		if(err) res.status(500).send({message: 'Error al devolver la publicación'});
		if(!publication) res.status(404).send({message: 'No se ha encontrado la publicación'});

		res.status(200).send({publication});
	});
}

module.exports = {
	probando,
	savePublication,
	getPublications,
	getPublication,

}