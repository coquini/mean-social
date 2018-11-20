'use strict'
// cargar el metodo mongoose-paginate
var mongoosePaginate = require('mongoose-pagination');
// encriptar contraseña
var bcrypt = require('bcrypt-nodejs');

// cargar files para trabajar con archivos
var fs = require('fs');

// cargar path para trabajar  con rutas de sistema de ficheros
var path = require('path');

// cargamos el modelo de usuario
var User = require('../models/user');

// cargamos jwt pasra la gestión de los tokens
var jwt = require('../services/jwt');
// cargamos modelo follow en getUser para más tarde crear un botón para seguir al usuario que nos sigue
var Follow = require('../models/follow');
// cargamos modelo publication 
var Publication = require('../models/publication');


// métodos de prueba
function home(req, res) {
	res.status(200).send({
		message:'Hola mundo desde el servidor nodejs'
	});
}

function pruebas(req, res) {
	//console.log(req.body);
	res.status(200).send({
		message:'Acción de pruebas en el servidor nodejs'
	});
}

// función para guardar usuarios Registro

function saveUser(req, res) {
	// para recoger los datos que nos lleguen  por post
	var params = req.body;
	// llamamos al modelo User para crear nuevos usuarios
	var user = new User();
    // creamos condicción para setear los datos recibidos
	if (params.name && params.surname && params.nick && params.password) {
		// setear los datos al objeto de usuario
		user.name = params.name;
		user.surname = params.surname;
		user.nick = params.nick;
		user.email = params.email;
		user.role = 'ROLE-USER';
		user.image = null;

		// metodo para controlar si el email y usuario existen/duplicados

		User.find({ $or: [
			                {email: user.email.toLowerCase()},
			                {nick: user.nick.toLowerCase()},
			             ]
        }).exec((err, users) => {
		  if(err) return res.status(500).send({message: 'Error en la petición de usuarios'});
	      if(users && users.length >= 1){
			    return res.status(200).send({message: 'El usuario y/o el correo que intentas registrar ya existe'})
		  }else{

        		// encripta la password y guarda los datos, se incluye aquí para de erorr al volver enviar los headers
        		bcrypt.hash(params.password, null, null, (err, hash)=> {
        			user.password = hash;
                    // guardar el usuario en mongodb
        			user.save((err, userStored) => {
        				if(err) return res.status(500).send({message: 'A ocurrido un error al guardar el usuario'});        

        				if(userStored){
        					res.status(200).send({user: userStored});
        				}else{
        					res.status(404).send({message: 'No se ha registrado el usuario'});
        				}
        			});
        		});

		  }
			        
		});

	}else{
		res.status(200).send({
			message: 'Envía todos los campos necesarios!!'
		});
	}
}

// Login

function loginUser(req, res) {
	// recibimos los datos por post
	var params = req.body;

	var email = params.email;
	var password = params.password;

	// verificar si existen password y email es como un where and

	User.findOne({email: email}, (err, user) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});
     
		if(user){
		// password lo que se le envía en el formulario user.password la que está almacenada en la base de datos encryptada
			bcrypt.compare(password, user.password, (err, check) => {
				if (check) {
					// token para encriptar los datos 
					if(params.gettoken){
						// devolver y devolver un token
						return res.status(200).send({
							token: jwt.createToken(user)
						});
					}else{
					    // devolver datos de usuario
					    user.password = undefined; // no mostrar contraseña al devolver los datos de user
					    return res.status(200).send({user});
				    }

				}else{
					return res.status(404).send({message: 'El usuario no se ha podido validar'});
			    }

			});    

	    }else{
		   return res.status(404).send({message: 'El usuario no se ha podido identicar'});
		}   
	});
}

// Conseguir datos de un usuario

function getUser(req, res) {
	var userId = req.params.id;

	User.findById(userId, (err, user) => {
		if(err) return res.status(500).send({message: 'Error en la petición'});

		if(!user) return res.status(404).send({message: 'El usuario no existe'});
        // comprobar en mongodb si nuestro usuario logueado ("user":req.user.sub) sigue a otro usuario 
       // ("followed":userId) que nos llega por la url
  	     //Follow.findOne({"user":req.user.sub, "followed":userId}).exec((err, follow) => {
		 //if(err) return res.status(500).send({message: 'Error al comprobar el seguimiento'});
		 // sustuimos lo de arriba por la función asincrona

		 followThisUser(req.user.sub, userId).then((value) => {
		        user.password = undefined;
                return res.status(200).send({
             	user,
             	following: value.following,
             	followed: value.followed,
             	
             });

    	 });

    });
	
}
// función asincrona --> sincrona con await, espera a que le llegue un resultado de la función antes de proseguir
async function followThisUser(identity_user_id, user_id) {
	try {
	       var following = await Follow.findOne({"user": identity_user_id, "followed": user_id}).exec()
	           .then((following) => {
	           	   return following;
	           })
	           .catch((err) => {
                   return handleError(err);
	           });
               
            var followed = await Follow.findOne({"user": user_id, "followed": identity_user_id}).exec()
               .then((followed) => {
               	   return followed;
               })
               .catch((err) => {
               	   return handleError(err);
               });
       		
            return {
       		    following: following,
           		followed: followed,
           		
           	}

	} catch (e){
		//console.log(e);
	}

}

// Devolver un listado de usuarios paginado, sub está definido en la variable playload en jwt.js

function getUsers(req, res) {
	var identity_user_id = req.user.sub;
    
    // obtenemos el valor de page
    var page = 1; // por defecto
	if(req.params.page){
         page = req.params.page;
	}
    // Listar 5 usuarios por página con User.find y organizamos con sort por _id
	var itemsPerPage = 5;

    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
        if(err) return res.status(500).send({message: 'Error en la petición del listado'});

        if(!users) return res.status(404).send({message: 'No hay usuarios disponibles'});
        followUserIds(identity_user_id).then((value) => {

        	return res.status(200).send({
        	    users,
        	    users_following: value.following,
        	    users_follow_me: value.followed,
            	total,
            	pages: Math.ceil(total/itemsPerPage) // redondeo y quita el numero de paginas totales 
            });

        });

    });
}

async function followUserIds(user_id) {
	try {
    	var following = await Follow.find({"user": user_id}).select({'_id':0, '_v':0, 'user':0}).exec()
    	    .then((following) => {
    	    	return following;
    	    })
    	    .catch((err) => {
    	    	return handleError(err);
    	    });

    	var followed = await Follow.find({"followed": user_id}).select({'_id':0, '_v':0, 'followed':0}).exec()
    	    .then((followed) => {
                return followed;
    	    })
    	    .catch((err) => {
    	    	return handleError(err);
    	    });
            
    	// Procesar following ids
        var following_clean = [];    

    		following.forEach((follow) => {
    			
    			following_clean.push(follow.followed);
    		});    
    
    	// Procesar followed ids
    	var followed_clean = [];    

    		followed.forEach((follow) => {
    		followed_clean.push(follow.user);
    			
    		});    

    	return {
    		following: following_clean,
    		followed: followed_clean,
    	}

    } catch (e) {
    	//console.log(e);
    }
}

function getCounters(req, res) {
	var userId = req.user.sub;

	if(req.params.id){
		userId = req.params.id;
	}

	getCountFollow(userId).then((value) => {
		////console.log(value);
		return res.status(200).send(value);
	});
}

async function getCountFollow(user_id) {
	try{

	    var following = await Follow.countDocuments({"user": user_id}).exec()
            .then((following) => {
            	//console.log(following);
                return following;
            })
    		.catch((err) => {
    			return handleError(err);
    		});

    	var followed = await Follow.countDocuments({"followed": user_id}).exec()
    	    .then((followed) => {
    	    	//console.log(followed);
    	    	return followed;
    	    })
    	    .catch((err) => {
    	    	return handleError(err);
    	    });
        var publications = await Publication.countDocuments({"user": user_id}).exec()
            .then((publications) => {
                //console.log(publications);
                return publications;
            })
            .catch((err) => {
                return handleError(err);
            });
    	return {
    		following: following,
    		followed: followed,
            publications: publications,
    	}
    } catch (e) {
    	//console.log(e);
    }	
}

// Edición datos de usuario

function updateUser(req, res) {
	var userId = req.params.id; // obtemos el id de usuario
	var update = req.body; // obtemos todos los datos de usuario


	//eliminar la contraseña recibida en el body
    delete update.password;

    // comprobar usuario enviado en la req "userId" con el usuario logueado del objeto del token "req.params.sub"

    if (userId != req.user.sub) {
    	return res.status(500).send({message: ' No tienes permisos para actualizar los datos de usuario'});
    }
    // evitar que usuarios/datos duplicados
    User.find({ $or: [
                  {email: update.email.toLowerCase()},
                  {nick: update.nick.toLowerCase()},
        ]}).exec((err, users) => {
            var user_isset = false;
            
            users.forEach((user) => {
                // si user existe y user._id != userId entonces user_isset = true
                if(user && user._id != userId) user_isset = true;
            });

            if(user_isset) return res.status(404).send({message: 'Los datos están en uso, prueba con otros'});
            

            // se incluye opción new en el método para que nos devuelva el json actualizado
            User.findByIdAndUpdate(userId, update, {new:true}, (err, userUpdated) => {
                if(err) return res.status(500).send({message: 'Error en la petición'});        

                if(!userUpdated) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});        

                return res.status(200).send({user: userUpdated});
            });   
        });
}


// Subir archivos de imagen/avatar usuario

function uploadImage(req, res) {
	var userId = req.params.id; // obtemos el id de usuario

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

    	// comprobar usuario enviado en la req "userId" con el usuario logueado del objeto del token "req.params.sub"
    	// se incluye return  en removeFilesOfUploads para que no de error (ya se han enviado las cabeceras headers) 
    	//al enviar más de una vez y corte la acción

        if (userId != req.user.sub) {
    	return removeFilesOfUploads(res, file_path, ' No tienes permisos para actualizar los datos de usuariossss');
        }

    	if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif' || file_ext == 'JPG'){
    		// Actualizar los datos de usuario logueado
    		User.findByIdAndUpdate(userId, {image: file_name}, {new:true}, (err, userUpdated) => {
    		if(err) return res.status(500).send({message: 'Error en la petición'});

    	    if(!userUpdated) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});

    	    return res.status(200).send({user: userUpdated});	
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
   var path_file = './uploads/users/'+image_file;

   fs.exists(path_file, (exists) => {
   	if(exists){
   		res.sendFile(path.resolve(path_file));
   	}else{
   		res.status(200).send({message: 'No existe la imagen...'});
   	}
   });
}

module.exports = {
	home,
	pruebas,
	saveUser,
	loginUser,
	getUser,
	getUsers,
	getCounters,
	updateUser,
	uploadImage,
	getImageFile,



}
