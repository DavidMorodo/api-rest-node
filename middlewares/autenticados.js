'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secreto = 'Scha1947lau-token-secret-Tat00in3';


exports.autenticado = function (req, res, next){
    //Comprobar si llega Authorization 
    if (!req.headers.authorization){
        return res.status(403).send({
            status: "400",
            error: "La petición no tiene la cabecera de Authorization"
        });
    }
    //Limpiar el token y quitar comillas
    var token = req.headers.authorization.replace(/['"]+/g, '');
    try{
        ////Decodificar el token
        var payload = jwt.decode(token, secreto);
        //Comprobar si el token ha expirado
        if (payload.exp <= moment().unix()){
            return res.status(404).send({
                message: "el token ha expirado"
            });
        }
    }catch(excepcion){
        return res.status(404).send({
            message: "el token no es valido"
        });
    }
    //Adjuntar usuario identificado a la request
    req.user = payload;
    //Pasar al siguiente metodo (NEXT)
    console.log("Estas pasando por el middleware");
    next();
};