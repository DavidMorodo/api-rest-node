'use strict'

//Requires
var express = require('express');
var bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);
//Ejecutar Express
var app = express();
app.disable('x-powered-by'); //SEGURIDAD:: Deshabilitar cabecera x-powered-by para evitar ataques
//Cargar Archivos de rutas
var peticiones_routes = require('./routes/peticiones')

//Middlewares
app.use(bodyParser.urlencoded({extended:false}));
//app.use(bodyParser.json());
app.use(bodyParser.json({ limit: "100MB" , extended: true}));
//app.use(bodyParser.text());
app.use(bodyParser.xml());
app.use(bodyParser.raw({ inflate: true, limit: '100kb', type: 'text/xml' }));




//CORS
// Configurar cabeceras y cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});


//Reescribir Rutas
app.use('/api', peticiones_routes);


//app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 999999999999999 }));


//Exportar el modulo
module.exports = app; 