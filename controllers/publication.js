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
	// pagina por defecto
	var page = 1;
	// obtemos el numero de paginas
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
		//console.log(follows_clean);
		// mostrar nuestras las publicaciones 
        follows_clean.push(req.user.sub);

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
				items_per_page: itemsPerPage,
				publications,
			});
		});

	});
}

// obterner las publicaciones de un usuario
function getPublicationsUser(req, res) {
	    // pagina por defecto
    	var page = 1;
    	// obtemos el numero de paginas
    	if(req.params.page){
    		page = req.params.page;
    	}

        var user = req.user.sub;
        if(req.params.user){
        	user = req.params.user;
        }

        // asignamos numero de publicaciones por pagina 
    	var itemsPerPage = 4;

	

		// obtener publicaciones de los que nos siguen, in busca la coincidencias dentro de un array
		// sort ordenamos publicaciones de más nuevas a más viejas, populate para obtener todos los datos, 
        
		Publication.find({user: user}).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) => {
			if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});

			if(!publications) return res.status(404).send({message: 'No hay publicaciones'});
			//console.log(publications);

			return res.status(200).send({ 
				total_items: total,
				pages: Math.ceil(total/itemsPerPage),
				page: page,
				items_per_page: itemsPerPage,
				publications,
			});
		});


	
}

// obtener publicación por id
function getPublication(req, res) {
	var publicationId = req.params.id;

	Publication.findById(publicationId, (err, publication) => {
		if(err) res.status(500).send({message: 'Error al devolver la publicación'});
		if(!publication) res.status(404).send({message: 'No se ha encontrado la publicación'});

		res.status(200).send({publication});
	});
}
// borrar publicacion del usuario logueado con id enviado por la url
function deletePublication(req, res) {
	var publicationId = req.params.id;
    
	Publication.find({'user': req.user.sub, '_id': publicationId}).deleteOne(err => {
		if(err) return res.status(500).send({message: 'Error al borrar la publicación'});
		
		//if(!publicationRemoved) return res.status(404).send({message: 'No se localiza la publicación'});

		res.status(200).send({message: 'Publicación eliminada correctamente'});
	});
}

function uploadImage(req, res) {
	var publicationId = req.params.id; // obtemos el id de publicación

    if (req.files) {
    	var file_path = req.files.image.path;
    	//console.log(file_path);
    	var file_split = file_path.split('/'); // cortamos el nombre del archivo que nos llega
    	//console.log(file_split); // llega [ 'uploads', 'users', 'g15vuxiJxHdLNzNpfI1oeKsU.JPG' ]
    	var file_name = file_split[2]; // nos quedemos con posición 2 que es 'g15vuxiJxHdLNzNpfI1oeKsU.JPG'
    	//console.log(file_name);
    	var ext_split = file_name.split('\.'); // quitamos el punto
    	//console.log(ext_split);
    	var file_ext = ext_split[1]; // eligimos la extensión del archivo jpg
    	//console.log(file_ext);

        

    	if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif' || file_ext == 'JPG'){
    		// comprobar si la publicación pertenece al usuario logueado
    		Publication.findOne({'user': req.user.sub, '_id':publicationId}).exec((err, publication) => {
              //console.log(publication);
    			if(publication){
            		// Actualizar el documento de la publicación
            		Publication.findByIdAndUpdate(publicationId, {file: file_name}, {new:true}, (err, publicationUpdated) => {
            		    if(err) return res.status(500).send({message: 'Error en la petición'});            

                	    if(!publicationUpdated) return res.status(404).send({message: 'No se ha podido actualizar la publicación'});            

                	    return res.status(200).send({publication: publicationUpdated});	
                	});
       			}else{
       				return removeFilesOfUploads(res, file_path, 'No tienes permiso para subir esta publicación');
       			}
    		});

    		
    	}else{
    		// llamamos a la función eliminar archivo si hay error
    		return removeFilesOfUploads(res, file_path, 'Extensión no válida');

    	}

    }else{
    	return res.status(200).send({message: 'No se han subido imagenes'});
    }
}

// funcion eliminar el archivo subido si hay error
function removeFilesOfUploads(res, file_path, message){
	fs.unlink(file_path, (err) => {
        return res.status(200).send({message: message});
    });

}

// Devolver una imagen con usuario logueado, parametro que recoge por la url "imageFile"

function getImageFile(req, res) {
   var image_file = req.params.imageFile;
   var path_file = './uploads/publications/'+image_file;

   fs.exists(path_file, (exists) => {
   	if(exists){
   		res.sendFile(path.resolve(path_file));
   	}else{
   		res.status(200).send({message: 'No existe la imagen...'});
   	}
   });
}

module.exports = {
	probando,
	savePublication,
	getPublications,
	getPublicationsUser,
	getPublication,
	deletePublication,
	uploadImage,
	getImageFile,

}