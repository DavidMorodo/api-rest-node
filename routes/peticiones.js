'use strict'
var express = require('express');
var router = express.Router();
var peticionesController=require('../controllers/peticiones');
var peticionesPrecios=require('../controllers/CheckPrecios');
var md_autenticado = require('../middlewares/autenticados');
//test precios *hasta los webs de WS Ekon....*
router.post('/precio',peticionesPrecios.test);
//Rutas de test
router.post('/status', md_autenticado.autenticado, peticionesController.probando);
router.post('/add', peticionesController.add);
router.get('/test/:testo/:otro', peticionesController.test);
router.post('/cifrado', peticionesController.cifrado);
router.post('/descifrado', peticionesController.descifrado);
router.post('/descifrado-2', peticionesController.descifrar_2);
//router.get('/precios-especiales', peticionesController.preciosEspeciales);
//router.get('/precios-especiales-art/GET', peticionesController.getPreciosEspecialesClienteArticulo);
//router.get('/precios-especiales/GET', peticionesController.getPreciosEspecialesCliente);

//router.get('/ws-intranet', peticionesController.ws_intranet_consultas);
router.post('/ws-intranet',peticionesController.ws_intranet_consultas_post);
router.post('/ws-intranet-prueba',peticionesController.consulta_articulos_prueba);
router.post('/strings',peticionesController.prueba_strings);
router.post('/busqueda-web',peticionesController.busqueda_web);
router.post('/prueba-bbdd',peticionesController.metodo_prueba_bbdd);

router.post('/ws-descargas',peticionesController.descargas_docs);
router.get('/doctech/:type?/:ref?/:batch?/:email?/:accion?',peticionesController.descargas);
//router.post('/ws-precios-venta',md_autenticado.autenticado, peticionesController.ws_precios_venta_ekon);
//router.get('/reiniciaServicio/:accion',peticionesController.reiniciarServicio);
//Descarga de facturas.
router.post('/ws_descarga_fras',peticionesController.ws_descarga_fras);
router.post('/ws-notificaciones-add',peticionesController.ws_notificaciones_add);
router.post('/ws-notificaciones-del',peticionesController.ws_notificaciones_del);

//ruta metodos post - grabacion o actualizacion de datos
router.post('/marcar-articulos-actualizados',peticionesController.marcar_articulos_actualizados);
router.post('/guardar-nombre-fichero-coa',peticionesController.guardar_nombre_fichero_coa);
router.post('/api-google-maps/:direccion',peticionesController.api_google_maps);

//Rutas de usuarios
router.post('/login', peticionesController.login);
router.post('/registro', peticionesController.registro_usuario);
router.post('/asignarClientes',   peticionesController.asignar_clientes_al_usuario);
//router.post('/actualizar', md_autenticado.autenticado, peticionesController.actualizar_usuario);
router.post('/update_usuario', peticionesController.actualizar_usuario);
//router.post('/update_usuario', peticionesController.update_user_datos);
router.post('/reset_password', peticionesController.reset_password);
router.post('/lista',  peticionesController.listar_usuarios);
router.post('/lista_clientes',    peticionesController.listar_clientes_conNombre_usuarios);
//duplicado de lista_clientes que usara Jose para el portal web
router.post('/listado_clientes',    peticionesController.listar_clientes_conNombre_usuarios);
router.post('/listado_clientes_new',    peticionesController.listar_clientes_conNombre_usuarios);
router.get('/usuario/:xusuario',  md_autenticado.autenticado, peticionesController.obtener_usuario);

router.post('/WS-IA',peticionesController.ws_ia_consultas_post);

module.exports = router;