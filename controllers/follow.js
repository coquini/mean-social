'use strict'

//var path = require('path');
//var fs = require('fs');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');
// guardar seguimiento
function saveFollow(req, res) {
	// recibimos  todos los paremetros que nos llegan por la función
	var params = req.body;

	// llamos al metodo modelo follow
	var follow = new Follow();
	// seteamos los valores
	follow.user = req.user.sub;
	follow.followed =  params.followed;

	follow.save((err, followStored) => {
		if(err) res.status(500).send({message: 'Error al guardar el seguimiento'});

		if(!followStored) res.status(404).send({message: 'El seguimiento no se ha guardado'});

		return res.status(200).send({follow:followStored});

	});
}
// borrar seguimiento
function deleteFollow(req, res) {
	// obtenemos usuario logueado
	var userId =  req.user.sub;
	// obtenemos usuario seguido followed
	var followId = req.params.id;

	Follow.find({'user': userId, 'followed': followId}).remove(err => {
		if(err) return res.status(500).send({message: 'Error al dejar de seguir'});

		return res.status(200).send({message: 'El follow se ha eliminado!!!'});
	});
}
// buscar usuarios que seguimos
function getFollowingUsers(req, res) {
	// obtenemos usuario logueado
	var userId = req.user.sub;
    // comprobar si nos llega el userId
	if(req.params.id && req.params.page){
		userId = req.params.id;
		

	}
    // creamos la variable page y se asignamos un valor por defecto la página 1
	var page = 1;
    // si recibimos datos de la pagina y no es la 1 se actualiza con los datos que llegan
	if(req.params.page){
		page = req.params.page;
	}else{
		page = req.params.id;
	}

	// asignar numero de usuarios por página
	var itemsPerPage = 4;
	// buscar todos los follows cuyo userId sea el usuario que está siguiendo, hay que popular la información del followed 
	//  y cambiar object id que hay guardado por el documento original correspondiente por ese object id
	Follow.find({user: userId}).populate({path: 'followed'}).paginate(page, itemsPerPage, (err, follows, total) =>{
		//devolvemos un resultado, si hay error
		if(err) return res.status(500).send({message: 'Error en el servidor'});
		if(!follows) return res.status(404).send({message: 'No estas siguiendo a ningún usuario'});
        //if(follows >=0) return res.status(404).send({message: 'No estás siguiendo ningún usuario'});
		
		followUserIds(req.user.sub).then((value) => {
           //console.log(follows);
    		return res.status(200).send({
    			total: total,
    			pages: Math.ceil(total/itemsPerPage), // recibimos las páginas, se redondea con .ceil y se obtiene el nº de la /
                follows,
                users_following: value.following,
        	    users_follow_me: value.followed,
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
            //console.log(following);
           //console.log(followed);
    	return {

    		following: following_clean,
    		followed: followed_clean,

    	}

    } catch (e) {
    	//console.log(e);
    }

}


// buscar usuarios que nos siguen
function getFollowedUsers(req, res) {
	// obtenemos usuario logueado
	var userId = req.user.sub;
    // comprobar si nos llega el userId
	if(req.params.id && req.params.page){
		userId = req.params.id;
	}
    // creamos la variable page y se asignamos un valor por defecto la página 1
	var page = 1;
    // si recibimos datos de la pagina y no es la 1 se actualiza con los datos que llegan
	if(req.params.page){
		page = req.params.page;
	}else{
		page = req.params.id;
	}

	// asignar numero de usuarios por página
	var itemsPerPage = 4;
	// buscar todos los follows cuyo userId sea el usuario que está siguiendo, hay que popular la información del followed 
	//  y cambiar object id que hay guardado por el documento original correspondiente por ese object id
	Follow.find({followed: userId}).populate('user').paginate(page, itemsPerPage, (err, follows, total) =>{
		//devolvemos un resultado, si hay error
		if(err) return res.status(500).send({message: 'Error en el servidor'});

		if(!follows) return res.status(404).send({message: 'No te sigue ningún usuario'});
		//if(follows >=0) return res.status(404).send({message: 'No te sigue ningún usuario'});

		followUserIds(req.user.sub).then((value) => {

    		return res.status(200).send({
    			total: total,
    			pages: Math.ceil(total/itemsPerPage), // recibimos las páginas, se redondea con .ceil y se obtiene el nº de la /
                follows,
                users_following: value.following,
        	    users_follow_me: value.followed,
    		});
	    });
	});
	//console.log(userId);
}
// Devolver el listado de usuarios que sigo y me siguen
function getMyFollows(req, res) {
    var userId = req.user.sub;

    var find = Follow.find({user: userId});

    if(req.params.followed){
    	find = Follow.find({followed: userId});
    }

    find.populate('user followed').exec((err, follows) => {
		if(err) return res.status(500).send({message: 'Error en el servidor'});

		if(!follows) return res.status(404).send({message: 'No sigues a ningún usuario'});
		//if(follows >=0) return res.status(404).send({message: 'No te sigue ningún usuariossss'});   
		
		return res.status(200).send({follows});		 	
    });
}


module.exports = {
	saveFollow,
	deleteFollow,
	getFollowingUsers,
	getFollowedUsers,
	getMyFollows,
}