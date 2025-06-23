'use strict'
var queryfunction = require('../querys/querys');
var validator = require('validator');
var jwt = require('../services/jwt.js');
var parseString = require('xml2js').parseString;
const axios = require('axios');
var generator = require('generate-password');
const CryptoJS = require('crypto-js');
const cifrado = require('../services/cifrados.js');
const OpenAI = require('openai');

//Requires base de datos
const { sqlConfig,EkonSqlConfig,EkonSqlClaranet,sqlWeb,sql_IA_Incidencias } = require('../keys');
const sql = require('mssql');
const { assing_secondary_client } = require('../querys/querys');
const e = require('express');
const { request } = require('express');
//esta es la conexion pool correcta.
//const pool1 = new sql.ConnectionPool(sqlConfig);
//const pool2 = new sql.ConnectionPool(EkonSqlConfig);
//David. 23_06_2025 intercambiamo los pools para que Desarrollo ataque a la BBDD Pruebas.
const pool2 = new sql.ConnectionPool(sqlConfig);
const pool1 = new sql.ConnectionPool(EkonSqlConfig);
//Fin Control Desarrollo
const pool3 = new sql.ConnectionPool(EkonSqlClaranet);
const pool32 = new sql.ConnectionPool(EkonSqlConfig);
const poolWeb = new sql.ConnectionPool(sqlWeb);
const pool_IA = new sql.ConnectionPool(sql_IA_Incidencias);
const limiteRegistrosBusqueda = 50000;
var hora = new Date().getHours();
var horaInicio = 0;
var horaFin = -1;
var pool1Connect = pool1.connect()
    .catch((error) =>{
    pool1.close();
    console.log('Ha fallando pool1');
});
var pool2Connect = pool2.connect()    
    .catch((error) =>{
    pool2.close();
    console.log('Ha fallando pool2');
});
var pool3Connect = pool3.connect()
    .catch((error) =>{
        pool3.close();
        pool3Connect = pool32.connect()
        console.log('Ha fallando pool3');
    });
var poolWebConnect = poolWeb.connect()
    .catch((error) =>{
        poolWeb.close();
        poolWebConnect = poolWeb.connect()
        console.log('Ha fallando poolWeb');
    });
var pool_IA_Connect = pool_IA.connect()
    .catch((error) =>{
        pool_IA.close();
        console.log('Ha fallando pool_IA');
    });

var controller = {
    cifrado: function (req, res) {
        //console.log(fecha_log() +  "cifrado  : "+ req.body.texto);
        var params = req.body;
        try{
            var ciphered = cifrado.cifrar(params.texto, "6MuOzKdenNKdNbmbW8i3ywr3t3OWgER2");
            //console.log(fecha_log() +  ciphered);
            return res.status(200).send({
                cifrado: ciphered,
                params
            });
        }catch(err){
            let body = req.body
            return res.status(400).send({
                body,
                err
            });
        }
        
    },
    
    descifrado: async function (req, res) {
        //console.log(fecha_log() +  "descifrado");
        try{
            var params = req.body;          
            var paramCifrado = params.cifrado;
            //console.log(fecha_log() +  "PARAMETRO DE CIFRADO? "+params.cifrado);
            //const unciphered = await cifrado.descifrar(paramCifrado, "6MuOzKdenNKdNbmbW8i3ywr3t3OWgER2");
            const descifrar_password_basedatos =  cifrado.descifrar(params.cifrado, "6MuOzKdenNKdNbmbW8i3ywr3t3OWgER2");
            //console.log(fecha_log() +  "Pass base de datos: " + descifrar_password_basedatos.toString(CryptoJS.enc.Utf8) );
            return res.status(200).send({
                descifrado: descifrar_password_basedatos
            }); 
        } catch (err) {
            console.error(fecha_log() + ' Descifrado error', err);
            return res.status(500).send({
                message: "Error en la peticion de descifrar",
            });
        }     
    },

    probando: function (req, res) {
        console.log(fecha_log() +  "probando");
        return res.status(200).send({
            server: 'OK',

        });
    },

    test: function (req, res) {
        console.log(fecha_log() +  "test");
        var ip = req.socket.remoteAddress;
        return res.status(200).send({
            message: 'Soy el metodo de test',
            ip
        });
    },
    //TEST SALESFORCE
    add: async function (req, res) {
        console.log(fecha_log() +  "add");
        var obj = req.body;
        var json = obj['yyws:insertar_ori']['yyws:json'];
        var bodyStr = JSON.stringify(json);
       //Formateo del texto para coger solo el json

        //Eliminar 3 primeros caracteres innecesarios
        bodyStr = bodyStr.replace(bodyStr.substring(0, 3), "");
        //Eliminar 3 ultimos caracteres innecesarios
        var strlen = bodyStr.length;
        bodyStr = bodyStr.replace(bodyStr.substring(strlen - 3, strlen), "");
        //Eliminar backslashes que crea stringify para obtener el json en raw
        bodyStr = bodyStr.replace(/\\/g, '');

        console.log(fecha_log() +  '---DATABASE TEXT----');
        console.log(fecha_log() +  bodyStr);
        console.log(fecha_log() +  '-------');
        //Recoger los parametros de la peticion
        //var params = req.body;
        //Validar los datos
        var validate_body = !validator.isEmpty(bodyStr);

        if (validate_body) {
            //Guardar registro en la base de datos
            await pool1Connect; // Me aseguro que la pool de conexiones esta creada
            try {
                const request = pool1.request(); // o: new sql.Request(pool1)
                const result = await request.query("INSERT INTO testwebservice (json) values ('" + bodyStr + "')");
                return res.status(200).send({
                    message: "Value Store Success"
                });
            } catch (err) {
                console.error(fecha_log() + ' SQL ADD METHOD', err);
                return res.status(500).send({
                    message: "Error en la peticion SQL",
                });
            }
        } else {
            return res.status(500).send({
                message: "JSON is empty",
            });
        }

    },
    
    registro_usuario: async function (req, res) {
        console.log(fecha_log() +  "registro_usuario");
        var params = req.body;
        //Validamos que existan los parametros
        //Convierto el req.body a texto para buscar los parametros con hasOwnProperty y poder verificar que existen
        var cadena_params = JSON.parse(JSON.stringify(req.body));
        //Si no viene algun parametro lo indico en un error 400
        console.log(fecha_log() +  cadena_params);
        if (!cadena_params.hasOwnProperty('xusuario') || !cadena_params.hasOwnProperty('xempresa_id')|| !cadena_params.hasOwnProperty('xcliente_id')|| !cadena_params.hasOwnProperty('xrol')|| !cadena_params.hasOwnProperty('xperfil')) {
            return res.status(400).send({
                status: "400",
                ws: "PETICION LOGIN",
                error: "Faltan parametros"
            });
        }       
        //Validar los datos :: Que no venga ningún parametro vacío
        var validar_username = !validator.isEmpty(params.xusuario);
        var validar_empresa = !validator.isEmpty(params.xempresa_id);
        var validar_cliente = !validator.isEmpty(params.xcliente_id);
        var validar_rol = !validator.isEmpty(params.xrol);
        var validar_perfil = !validator.isEmpty(params.xperfil);
        if(validar_username && validar_empresa && validar_perfil && validar_cliente && validar_rol){
            //COMPROBAR QUE NO EXISTE UN USUARIO CON EL MISMO XUSUARIO EN LA BASE DE DATOS
            var username = params.xusuario.toLowerCase();
            try{
                const existe_usuario = await queryfunction.exist_user(username);
                const existe_empresa_cliente = await queryfunction.verificar_empresa_cliente(params.xempresa_id, params.xcliente_id); //Verifica que exista el conjunto en la tabla de ekon
                const existe_registro_empresa_cliente = await queryfunction.exist_company_cliente(params.xcliente_id, params.xempresa_id); //Comprueba si ya existe este conjuntoen la tabla yy_ws_intranet_usu ya que debe ser unico
                if(!existe_empresa_cliente){
                    return res.status(400).send({
                        status: "400",
                        message: "Verifica empresa y cliente",
                    });
                }
                if(existe_registro_empresa_cliente){
                    return res.status(400).send({
                        status: "400",
                        message: "Ya existe un usuario registrado con la empresa y cliente proporcionados",
                    });
                }
                if (existe_usuario){
                    console.log(fecha_log() +  "existe_usuario= "+ existe_usuario);
                    //ENTONCES NO SE PUEDE GUARDAR EN LA BASE DE DATOS
                    return res.status(400).send({
                        status: "400",
                        message: "Ya existe ese usuario",
                    });
                }else{
                    //Insertar usuario en la base de datos
                    try{
                        var password = generator.generate({
                            length: 10,
                            numbers: true,
                            symbols: false
                        })
                        const cifrar_password =  await cifrado.cifrar(password, "Scharlab1947");
                        console.log(fecha_log() +  cifrar_password);
                        await queryfunction.insert_user(params.xusuario.toLowerCase(), params.xempresa_id.toUpperCase(), params.xcliente_id ,params.xrol.toLowerCase() , params.xperfil.toLowerCase(), cifrar_password);
                        return res.status(200).send({
                            status: 'Success',
                            message: 'Usuario Registrado correctamente',
                            usuario: username,
                            password
                        });
                    }catch(err){
                        console.log(fecha_log() +  err)
                        return res.status(400).send({
                            server: 'Fallo en la peticion',
                
                        });
                    }
                   
                }    
            }catch(err){
                return res.status(500).send({
                    status: "500",
                    message: "Error en la peticion",
                });
            }
                    
        }else{
            console.log(fecha_log() +  'Fallo en los parametros');
            return res.status(400).send({
                server: 'Fallo en los parametros',
    
            });
        }
   },

   actualizar_usuario: async function (req, res) {
    //David. 3-2-2023
    console.log(fecha_log() +  "actualizar_usuario");
    var params = req.body;
    //console.log (params);
    //Validamos que existan los parametros
    //Convierto el req.body a texto para buscar los parametros con hasOwnProperty y poder verificar que existen
    var cadena_params = JSON.parse(JSON.stringify(req.body));
    //Si no viene algun parametro lo indico en un error 400
   // console.log(fecha_log() +  cadena_params);
    if (!cadena_params.hasOwnProperty('xusuario') || !cadena_params.hasOwnProperty('xempresa_id')|| !cadena_params.hasOwnProperty('xcliente_id')|| !cadena_params.hasOwnProperty('xrol')|| !cadena_params.hasOwnProperty('xperfil')|| !cadena_params.hasOwnProperty('xnombre') || !cadena_params.hasOwnProperty('xapellidos')) {
        return res.status(400).send({
            status: "400",
            ws: "PETICION LOGIN",
            error: "Faltan parametros"
        });
    }   
    //Validar los datos :: Que no venga ningún parametro vacío
    var validar_username = !validator.isEmpty(params.xusuario);
    var validar_empresa = !validator.isEmpty(params.xempresa_id);
    var validar_cliente = !validator.isEmpty(params.xcliente_id);
    var validar_rol = !validator.isEmpty(params.xrol);
    var validar_perfil = !validator.isEmpty(params.xperfil);
    //var validar_xpassword = !validator.isEmpty(params.xpassword);
    var xnombre = !validator.isEmpty(params.xnombre);
    var xapellidos = !validator.isEmpty(params.xapellidos);
    var xemail = !validator.isEmpty(params.xemail);   
 
     if (cadena_params.hasOwnProperty('xemail_responsable')){
        var xemail_responsable = !validator.isEmpty(Object.is(params.xemail_responsable,null)?params.xemail:params.xemail_responsable);
    }
    var xemail_pedidos = cadena_params.xemail_pedidos[0];
    for (var i=1;i<params.xemail_pedidos.length;i++){
        xemail_pedidos += ";" + cadena_params.xemail_pedidos[i];
    }

    var xemail_notificaciones = cadena_params.xemail_notificaciones[0];  
    for (var i=1;i<params.xemail_notificaciones.length;i++){
        xemail_notificaciones += ";" + cadena_params.xemail_notificaciones[i];
    }

    if(validar_username && validar_empresa && validar_perfil && validar_cliente && xnombre && xapellidos && xemail && xemail_pedidos){
        var username = params.xusuario.toLowerCase();
        try{
            const existe_registro_empresa_cliente = await queryfunction.exist_user_company_cliente(params.xusuario,params.xcliente_id, params.xempresa_id); //Comprueba si ya existe este conjuntoen la tabla yy_ws_intranet_usu ya que debe ser unico
            if(!existe_registro_empresa_cliente){
                return res.status(400).send({
                    status: "400",
                    message: "Verifica empresa, cliente y usuario.",
                });
       
            }else{
                //Actualizar usuario en la base de datos
                try{
                    await queryfunction.update_user_datos_v2 (params.xempresa_id,  params.xcliente_id, params.xusuario, params.xrol.toLowerCase(),  params.xperfil.toLowerCase(),params.xemail, params.xemail_responsable,params.xnombre,params.xapellidos, xemail_pedidos,xemail_notificaciones);
                   
                    return res.status(200).send({
                        status: 'Success',
                        message: 'Usuario Actualizado correctamente',
                    });
                }catch(err){
                    console.log(fecha_log() +  err)
                    return res.status(400).send({
                        server: 'Fallo en la peticion',
            
                    });
                }
               
            }    
        }catch(err){
            return res.status(500).send({
                status: "500",
                message: "Error en la peticion",
            });
        }
                
    }else{
        console.log(fecha_log() +  'Fallo en los parametros');
        return res.status(400).send({
            server: 'Fallo en los parametros',

        });
    }
},

reset_password: async function (req, res) {
    //console.log(fecha_log() +  "reset_password");
    //console.log(fecha_log() +  req.user);
    var params = req.body;
    //Validamos que existan los parametros
    //Convierto el req.body a texto para buscar los parametros con hasOwnProperty y poder verificar que existen
    var cadena_params = JSON.parse(JSON.stringify(req.body));
    //Si no viene algun parametro lo indico en un error 400
   // console.log(fecha_log() +  cadena_params);
    if (!cadena_params.hasOwnProperty('xpassword')) {
        return res.status(400).send({
            status: "400",
            ws: "PETICION RESET PASSWORD",
            error: "Faltan parametros"
        });
    }       
    //Validar los datos :: Que no venga ningún parametro vacío
    var validar_xpassword = !validator.isEmpty(params.xpassword);
    if(validar_xpassword){
        //Actualizar usuario en la base de datos
        try{
            const password  = cifrado.descifrar(params.xpassword, "6MuOzKdenNKdNbmbW8i3ywr3t3OWgER2");
            const password_cifrada = cifrado.cifrar(password, "6MuOzKdenNKdNbmbW8i3ywr3t3OWgER2");
            //await queryfunction.update_user_password(req.user.xusuario, req.user.xempresa_id, req.user.xcliente_id, req.user.xusuario , req.user.xrol,  req.user.perfil, password_cifrada);
            await queryfunction.change_user_password(params.xusuario, params.xempresa_id, params.xcliente_id, params.xemail, password_cifrada);
            return res.status(200).send({
                status: 'Success',
                message: 'Password Actualizada correctamente',
            });
        }catch(err){
            console.log(fecha_log() +  err)
            return res.status(400).send({
            server: 'Fallo en la peticion',
            });
        }            
    }else{
        console.log(fecha_log() +  'Fallo en los parametros');
        return res.status(400).send({
            server: 'Fallo en los parametros',

        });
    }
},  

    obtener_usuario: async function (req, res) {
        //console.log(fecha_log() +  "obtener_usuario");
        var username = req.params.xusuario;
        //Validamos que existan los parametros
        //Convierto el req.body a texto para buscar los parametros con hasOwnProperty y poder verificar que existen
        //Si no viene algun parametro lo indico en un error 400      
        const existe_usuario = await queryfunction.exist_user(username);
        if (!existe_usuario) {
            console.log(fecha_log() +  "existe_usuario= " + existe_usuario);
            //ENTONCES NO SE PUEDE OBTENER
            return res.status(400).send({
                status: "400",
                message: "No existe ese usuario",
            });
        } else {
            const user = await queryfunction.get_user(username);
            console.log(fecha_log() +  user);
            return res.status(200).send({
                /*xempresa_id: usuario.xempresa_id ,
                xusuario: usuario.xusuario ,
                xpassword: usuario.xpassword ,
                xcliente_id: usuario.xcliente_id ,
                xperfil: usuario.xperfil,
                xrol: usuario.xrol*/
                user

            });
        }
    },
    
    listar_usuarios: async function (req, res) {
        console.log(fecha_log() +  "listar_usuarios");
        try{
            const users = await queryfunction.users_list();
            return res.status(200).send({
                status: "200",
                ws: "PETICION OBTENER LISTA DE USUARIOS",
                users
            });

        }catch(error){
            return res.status(400).send({
                status: "400",
                message: "Error Interno",
                error
            })
        }
    },

    
    listar_clientes_conNombre_usuarios: async function (req, res) { //Devuelve solo los clientes secundarios no el principal
        console.log(fecha_log() +  "listar_clientes_conNombre_usuarios");
        async function getNombreCliente(usuario, codigoCliente){
            try{
                const empresaUsuario = await queryfunction.user_company(usuario);
                console.log(fecha_log() +  "335: "+JSON.stringify(empresaUsuario));
                const empresa = empresaUsuario[0].xempresa_id;
                console.log(fecha_log() +  "337: "+JSON.stringify(empresa));
                const nombreCliente = await queryfunction.client_name_by_code(empresa, codigoCliente);
                console.log(fecha_log() +  "339: "+JSON.stringify(nombreCliente));
                return nombreCliente[0].xnombre;
            }catch(err){
                console.log(fecha_log() +  err);
                return err;
            }  
        }
        try{
            const users_query = await queryfunction.users_clients_list();
            var usersbyclient = [];
            for (const user_query of users_query){
                const encontrado = usersbyclient.find(x => x.xusuario === user_query.xusuario);
                console.log(fecha_log() +  "342: "+user_query.xcliente_id_secundario);
                if(user_query.xcliente_id_secundario != null){
                    if(encontrado ){
                        console.log(fecha_log() +  "354: "+JSON.stringify(encontrado));
                        const indexEncontrado = usersbyclient.findIndex( (element) => element.xusuario === user_query.xusuario);
                        var clientes = [];
                        clientes = usersbyclient[indexEncontrado].clientes;
                        const nombreCliente = await getNombreCliente(user_query.xusuario,user_query.xcliente_id_secundario );
                        const InsertarCliente = user_query.xcliente_id_secundario + " " + nombreCliente;
                        clientes.push(InsertarCliente);
                        usersbyclient[indexEncontrado].clientes = clientes;
                        console.log(fecha_log() +  "352: "+clientes);
                    }else{
                        const nombreClientePrincipal = await getNombreCliente(user_query.xusuario,user_query.xcliente_id ); 
                        const InsertarClientePrincipal =   user_query.xcliente_id + " " + nombreClientePrincipal;
                        const nombreCliente = await getNombreCliente(user_query.xusuario,user_query.xcliente_id_secundario ); 
                        const InsertarCliente =   user_query.xcliente_id_secundario + " " + nombreCliente;
                        const user = {
                            xusuario: user_query.xusuario,
                            xperfil:  user_query.xperfil,
                            xrol:  user_query.xrol,
                            xempresa_id:  user_query.xempresa_id,
                            xcliente_id: user_query.xcliente_id,
                            xnombre: nombreClientePrincipal,
                            cliente:InsertarClientePrincipal,
                            clientes:[InsertarCliente],
                            codigos_secundarios:[{xcliente_id: user_query.xcliente_id_secundario,xnombre: nombreCliente}]
                        };
                        await console.log(fecha_log() +  "363: "+JSON.stringify(user));
                        await usersbyclient.push(user);
                    }
                }else{
                        const nombreClientePrincipal = await getNombreCliente(user_query.xusuario,user_query.xcliente_id ); 
                        const InsertarClientePrincipal =   user_query.xcliente_id + " " + nombreClientePrincipal; 
                        const user = {
                            xusuario: user_query.xusuario,
                            xperfil:  user_query.xperfil,
                            xempresa_id:  user_query.xempresa_id,
                            xcliente_id: user_query.xcliente_id,
                            xrol:  user_query.xrol,
                            cliente:InsertarClientePrincipal,
                        };
                        
                        await usersbyclient.push(user);
                        await console.log(fecha_log() +  "373: "+JSON.stringify(usersbyclient));
                }
                    
            }
            await console.log(fecha_log() +  "378/n"+usersbyclient);
            return res.status(200).send({
                status: "200",
                ws: "PETICION OBTENER LISTA DE CLIENTES POR CADA USUARIO",
                usersbyclient
            });

        }catch(error){
            return res.status(400).send({
                status: "400",
                message: "Error Interno",
                error
            })
        }
    },

    listar_clientes_usuarios: async function (req, res) { //Devuelve solo los clientes secundarios no el principal
        console.log(fecha_log() +  "listar_clientes_usuarios");
        try{
            const users_query = await queryfunction.users_clients_list();
            //console.log(fecha_log() +  users);
            var usersbyclient = [];
            for (const user_query of users_query){
                const encontrado = usersbyclient.find(x => x.xusuario === user_query.xusuario); 
                console.log(fecha_log() +  user_query.xusuario);
                console.log(fecha_log() +  "Encontrado :" + JSON.stringify(encontrado));
                if(encontrado){
                    const indexEncontrado = usersbyclient.findIndex( (element) => element.xusuario === user_query.xusuario);
                    console.log(fecha_log() +  "IndexEncontrado :");
                    console.log(fecha_log() +  usersbyclient[indexEncontrado]);    
                    var clientes = [];
                    clientes = usersbyclient[indexEncontrado].clientes;
                    clientes.push(user_query.xcliente_id_secundario);
                    console.log(fecha_log() +  "Clientes:  :");
                    console.log(fecha_log() +  clientes);
                    usersbyclient[indexEncontrado].clientes = clientes;
                }else{                 
                    const user = {
                        xusuario: user_query.xusuario,
                        clientes:[user_query.xcliente_id_secundario]
                    };
                    console.log(fecha_log() +  usersbyclient);
                    await usersbyclient.push(user);
                }
                
            }
            return res.status(200).send({
                status: "200",
                ws: "PETICION OBTENER LISTA DE CLIENTES POR CADA USUARIO",
                usersbyclient
            });

        }catch(error){
            return res.status(400).send({
                status: "400",
                message: "Error Interno",
                error
            })
        }
    },

    asignar_clientes_al_usuario: async function (req, res) {
        console.log(fecha_log() +  "asignar_clientes_al_usuario");
        var params = req.body;
        //Validamos que existan los parametros
        //Convierto el req.body a texto para buscar los parametros con hasOwnProperty y poder verificar que existen
        var cadena_params = JSON.parse(JSON.stringify(req.body));
        //Si no viene algun parametro lo indico en un error 400
        if (!cadena_params.hasOwnProperty('username') || !cadena_params.hasOwnProperty('empresa')|| !cadena_params.hasOwnProperty('cliente') || !cadena_params.hasOwnProperty('cliente_secundario')) {
            return res.status(400).send({
                status: "400",
                ws: "PETICION ASIGNAR CLIENTE SECUNDARIO",
                error: "Faltan parametros"
            });
        }       
        //Validar los datos :: Que no venga ningún parametro vacío
        var validar_username = !validator.isEmpty(params.username);
        var validar_empresa = !validator.isEmpty(params.empresa);
        var validar_cliente = !validator.isEmpty(params.cliente);
        var validar_cliente_secundario = !validator.isEmpty(params.cliente_secundario);
        if(validar_username && validar_empresa && validar_cliente_secundario && validar_cliente ){
            //COMPROBAR QUE EXISTE EN LA TABLA yy_ws_intranet_usu EL USUARIO CON EMPRESA Y CLIENTE
            //VALIDAR QUE EXISTE EN EKON EMPRESA VS CLIENTE
            //SI EXISTE AGREGAR A LA TABLA yy_ws_intra_usu_cli la entrada de xusuario, xcliente_id, xempresa_id y xcliente_id_secundario
            var username = params.username.toLowerCase();
            try{
                const existe_usuario_empresa_cliente = await queryfunction.exist_user_company_cliente(params.username, params.cliente, params.empresa);
                console.log(fecha_log() +  existe_usuario_empresa_cliente);
                if(!existe_usuario_empresa_cliente){
                    const message = "No existe el usuario: "+params.username+" con cliente asignado : "+ params.cliente+" para la empresa: "+params.empresa;
                    return res.status(400).send({
                        status: "400",
                        message
                    });
                }
                const existe_empresa_cliente = await queryfunction.verificar_empresa_cliente(params.empresa, params.cliente_secundario); //Verifica que exista el conjunto en la tabla de ekon
                const existe_registro_empresa_cliente = await queryfunction.exist_company_cliente(params.cliente_secundario, params.empresa); //Comprueba si ya existe este conjunto en la tabla yy_ws_intranet_usu ya que debe ser unico
                if(!existe_empresa_cliente){//Compruebo que el cliente pertenezca la empresa
                    return res.status(400).send({
                        status: "400",
                        message: "Verifica empresa y cliente",
                    });
                }
                if(existe_registro_empresa_cliente){//Compruebo que no haya ningún usuario con empresa y cliente creado
                    return res.status(400).send({
                        status: "400",
                        message: "Ya existe un usuario registrado con la empresa y cliente proporcionados",
                    });
                }else{//Guardo en la tabla 'yy_ws_intra_usu_cli' el cliente
                    //asignar cliente secundario
                    try{
                        await assing_secondary_client(params.username, params.empresa, params.cliente, params.cliente_secundario);
                        return res.status(200).send({
                            status: "200",
                            message: "Cliente secundario asignado al cliente principal"
                        })
                    }catch(err){
                        console.log(fecha_log() +  err);
                        return res.status(400).send({
                            status: "400",
                            message: "Error Interno"
                        })
                    }        
                }
                    
            }catch(err){
                return res.status(500).send({
                    status: "500",
                    message: "Error en la peticion",
                });
            }
                    
        }else{
            console.log(fecha_log() +  'Fallo en los parametros');
            return res.status(400).send({
                server: 'Fallo en los parametros',
    
            });
        }
   },

     login: async function (req, res) {
        //Recoger los parametros de la peticion
        var params = req.body;
        //Validamos que existan los parametros
        //Convierto el req.body a texto para buscar los parametros con hasOwnProperty y poder verificar que existen
        var cadena_params = JSON.parse(JSON.stringify(req.body));
        //console.log(fecha_log() +  cadena_params);
        //Si no viene algun parametro lo indico en un error 400
        if (!cadena_params.hasOwnProperty('xusuario') || !cadena_params.hasOwnProperty('password')) {
            //Oculto la contraseña en caso de enviar error y la contraseña se halla enviado
            if (cadena_params.password) {
                cadena_params.password = null;
            }
            return res.status(400).send({
                status: "400",
                ws: "PETICION LOGIN",
                error: "Faltan parametros"
            });
        }
        //Validar los datos :: Que no venga ningún parametro vacío
        var validar_username = !validator.isEmpty(params.xusuario);
        var validar_password = !validator.isEmpty(params.password);
        //Validamos que vengan los parametros con valores
        if (!validar_username || !validar_password) {
            return res.status(400).send({
                status: "400",
                ws: "PETICION LOGIN",
                error: "Faltan Credenciales"
            });
        }
        //Buscar usuario que coincida con el nombre de usuario
        await pool1Connect; // Me aseguro que la pool de conexiones esta creada
        await pool2Connect;
        try {
            const request = pool1.request(); // o: new sql.Request(pool1)
            const password_consulta = "SELECT xpassword, xempresa_id, xcliente_id, xperfil, xrol,xemail,xemail_responsable,xnombre,xapellidos FROM yy_ws_intranet_usu WHERE xusuario = '" + params.xusuario.toLowerCase() + "'";
            const resultado_password_consulta = await request.query(password_consulta);
            const numero_resultados_consulta_password = resultado_password_consulta.recordset.length;
            //Si el numero de resultados es == 0 es que no se ha encontrado el usuario
            if (numero_resultados_consulta_password == 0) {
                return res.status(400).send({
                    status: "400",
                    ws: "PETICION LOGIN",
                    error: "No existe el usuario"
                });
            } else {//Si no, significa que  encuentra el usuario en la base de datos
                //Me guardo la contraseña del usuario en una variable
                var password_usuario = resultado_password_consulta.recordset[0].xpassword;
                var empresa_usuario = resultado_password_consulta.recordset[0].xempresa_id;
                var cliente_usuario = resultado_password_consulta.recordset[0].xcliente_id;
                var perfil_usuario = resultado_password_consulta.recordset[0].xperfil;
                var rol_usuario = resultado_password_consulta.recordset[0].xrol;
                var email_usuario = resultado_password_consulta.recordset[0].xemail;
                var email_responsable = resultado_password_consulta.recordset[0].xemail_responsable;
                var nombre_usuario = resultado_password_consulta.recordset[0].xnombre;
                var apellidos_usuario = resultado_password_consulta.recordset[0].xapellidos;
                //Si la contraseña que recibo en params.password es la misma que la de la base de datos la peticion es OK 200 success
                //Comprobar la contraseña (Coincidencia de nombre de usuario / password (Bcrypt))
                const descifrar_password_basedatos =  await cifrado.descifrar(password_usuario, "6MuOzKdenNKdNbmbW8i3ywr3t3OWgER2");
                const descifrar_password_parametros =  await cifrado.descifrar(params.password, "6MuOzKdenNKdNbmbW8i3ywr3t3OWgER2");
                if (descifrar_password_basedatos.toString(CryptoJS.enc.Utf8) == descifrar_password_parametros.toString(CryptoJS.enc.Utf8)) {
                //if (descifrar_password_basedatos.toString(CryptoJS.enc.Utf8) == params.password) {
                    //console.log(fecha_log() +  "IGUALES");
                    var user = {
                        xusuario: params.xusuario,
                        xempresa_id: empresa_usuario,
                        xcliente_id: cliente_usuario,
                        xperfil: perfil_usuario,
                        xrol: rol_usuario,
                        xemail: email_usuario,
                        xemail_responsable: email_responsable,
                        xnombre: nombre_usuario,
                        xapellidos: apellidos_usuario
                    };
                    var usuario = params.xusuario.toLowerCase();
                    //Generar token para devolverlo

                    //Guardamos el log en una tabla en BBDD
                    var ip = req.socket.remoteAddress;
                    await request.query("INSERT INTO yylogin_intranet (xempresa_id, xusuario, xcliente_id, xfecha_login,xip_login) VALUES ('"+empresa_usuario+"', '"+usuario+"', '"+cliente_usuario+"', GETDATE(),'"+ip+"');");
                    return res.status(200).send({
                        status: "200",
                        xusuario: usuario,
                        xempresa_id: empresa_usuario,
                        xcliente_id: cliente_usuario,
                        xperfil: perfil_usuario,
                        xrol: rol_usuario,
                        xemail: email_usuario,
                        xemail_responsable: email_responsable,
                        xnombre: nombre_usuario,
                        xapellidos: apellidos_usuario,
                        token: jwt.createToken(user)
                    });
                } else {
                    var passbdd = descifrar_password_basedatos.toString(CryptoJS.enc.Utf8);
                    var passin = descifrar_password_parametros.toString(CryptoJS.enc.Utf8);
                    var paramspass = params.password;
                    return res.status(400).send({
                        status: "400",
                        ws: "PETICION LOGIN",
                        error: "Password Incorrecta",
                    });
                }
            }
            //Si falla la peticion sql envio el error
        } catch (err) {
            console.error(fecha_log() + ' Login error', err);
            return res.status(500).send({
                status: "500",
                ws: "PETICION LOGIN",
                error: "Error Interno en la peticion"
            });
        }
    }, 

    //BUENO :: NO TOCARR
    ws_intranet_consultas_post: async function (req, res) {
        //David. 30_8_2024. añadimos un control horario para el pool1. Entre las 0 y las 6 el sistema accederá a Claranet.
        //OJO Pool 2 es BBDD Real para grabar resultados. lo ha de hacer en PROD.
        hora = new Date().getHours();
        var request = pool1.request(); // o: new sql.Request(pool1)
        if (hora >= horaInicio && hora <= horaFin){
            request = pool3.request(); // o: new sql.Request(pool1)
            //console.log(fecha_log() + "-Conectado a la base datos de CLARANET." + (await pool3Connect).connected)
        };
        var paramsHeader = req.headers;
        var paramsBody = req.body;
        
        const ws = paramsBody.ws;
        const xempresa_id = paramsBody.xempresa_id;
        const max_registros = paramsBody.max_registros;
        //console.log ("WS:" + ws);
        //buscamos la select en la tabla de parametros
        if (ws != null && xempresa_id != null) {
            var errorString ='';
            try {
                //const request = pool1.request(); // o: new sql.Request(pool1)
                const consultaSqlWS = "SELECT xempresa_id, xquery, xconsulta, xparametros, xws_ekon, xcampos_objeto, xcampos_tipo_in,xcontador FROM yy_ws_intranet WHERE xempresa_id = '" + xempresa_id + "' AND xquery = '" + ws + "';";
                console.log ("SQL:" + consultaSqlWS );
                const resultadoConsultaSql = await request.query(consultaSqlWS);
                //console.log(fecha_log() +  "TOTAL DE FILAS: " + resultadoConsultaSql.recordsets[0].length);
                if (resultadoConsultaSql.recordsets[0].length == 0) {
                    return res.status(400).send({
                        status: "400", ws, error: "Peticion incorrecta"
                    });
                }
                var xcontador = resultadoConsultaSql.recordsets[0][0].xcontador;
                var selectResultado = resultadoConsultaSql.recordsets[0][0].xconsulta;
                var parametrosResultado = resultadoConsultaSql.recordsets[0][0].xparametros;
                var wsEkon = resultadoConsultaSql.recordsets[0][0].xws_ekon;
                var camposObjeto = resultadoConsultaSql.recordsets[0][0].xcampos_objeto;
                var camposTipoIn = resultadoConsultaSql.recordsets[0][0].xcampos_tipo_in;
                 //leer parametros que hay definidos en "parametrosResultado" y trocearlo segun la coma que los separa
                 var parametrosResultadoSplit = parametrosResultado != null ? parametrosResultado.split(",") : null;
                 var camposTipoInSplit = camposTipoIn != null ? camposTipoIn.split(",") : '';
                 //parametros de url en json
                 const jsonParametrosBody = JSON.parse(JSON.stringify(paramsBody));
                 //comprobar que estan esos parametros en url
                 const mapaParametros = new Map();
                
                 for (var param in parametrosResultadoSplit) {	
                    if (jsonParametrosBody[parametrosResultadoSplit[param]] != null) {	
                        console.log(fecha_log() +  parametrosResultadoSplit[param] + ' --- ' + jsonParametrosBody[parametrosResultadoSplit[param]]);	
                        if(camposTipoInSplit.includes(parametrosResultadoSplit[param])){	
                            console.log(fecha_log() + "camposTipoInSplit: " + jsonParametrosBody[parametrosResultadoSplit[param]] );
                            var d = "(";	
                            for(var i=0; i<jsonParametrosBody[parametrosResultadoSplit[param]].length; i++){	
                                d+="'"+jsonParametrosBody[parametrosResultadoSplit[param]][i]+"',";	
                            }	
                            console.log(fecha_log() +  d);	
                            d = d.substring(0, d.length -1);	
                            d += ")";	

                            var sustituto = d;	
                            selectResultado = await selectResultado.replaceAll("{" + parametrosResultadoSplit[param] + "}", sustituto);	
                        }else{	
                            var sustituto = typeof jsonParametrosBody[parametrosResultadoSplit[param]] == 'number' ? jsonParametrosBody[parametrosResultadoSplit[param]] : "'"+jsonParametrosBody[parametrosResultadoSplit[param]]+"'";	
                            selectResultado = await selectResultado.replaceAll("{" + parametrosResultadoSplit[param] + "}", sustituto);	
                        }	
                    } else {	
                        //const parametrosResultadoSplit[param] = parametros.parametrosResultadoSplit[param];	
                        //console.log(fecha_log() +  parametrosResultadoSplit[param]);	
                        return res.status(400).send({	
                            status: "400", ws, error: "Faltan parametros"	
                        });	
                    }	
                }	
                console.log(fecha_log() +  'SELECT: '+selectResultado);
                if (wsEkon == '-1') {
                    //console.log(fecha_log() + 'WS: ' + ws);
                    //llamada aun WS de Ekon donde le enviamos parametros y el mismo responde
                    //console.time();
                    var config = {
                        method: 'POST',
                        url: selectResultado,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Basic REJBV0VCOkRiYXdlYjEx'
                        },
                        data: paramsBody
                    };
                    let axiosresp = await axios(config);
            
                    let respuesta = [];
                    respuesta.push(axiosresp.data);//JSON.stringify(respuesta.data);
                    //control_precios(req,200); //19/09/24 anulamos el control de precios. el error lo generaba la replica nueva.
                   // console.timeEnd();
                    return res.status(200).send({
                        status: "200",
                        ws,
                        respuesta
                    });
                   
                } else {
                    //sustituimos el maximos de registros si lo hay
                    var registros = 0;
                    if(max_registros != null && max_registros != ''){
                        if(typeof max_registros == 'number'){
                            selectResultado = await selectResultado.replaceAll("{max_registros}","SELECT TOP "+max_registros);
                        }else{
                            return res.status(400).send({
                                status: "400", ws, error: "Registros máximos incorrectos"
                            });
                        }
                    }else{
                        selectResultado = await selectResultado.replaceAll("{max_registros}","SELECT ");
                    }
                    //console.log(fecha_log() +  "SELECT OK: " + selectResultado);
                    //ejecutamos la select devuelta de la tabla de consultas
                    const resultadoSelectPedida = await request.query(selectResultado);
                  
                    var respuesta = resultadoSelectPedida.recordsets[0];
                    registros = respuesta.length;
                    
                    if(camposObjeto != null && camposObjeto != ''){
                        //leer campos objeto que hay en el campo "camposObbjeto"
                        var camposObjetoSplit = camposObjeto != null ? camposObjeto.split(",") : '';     
                        for(var i=0; i<respuesta.length; i++){
                            for (var r in respuesta[i]) {
                                if(camposObjetoSplit.includes(r)){
                                    if(respuesta[i][r] != null){
                                        if (xcontador == '-1'){
                                        respuesta[i][r] = JSON.parse(respuesta[i][r].replaceAll('\n', ' ').replaceAll('\\','').replaceAll('\t','').replaceAll('\\\\','').replaceAll('\r', ' '));
                                        }else{
                                        respuesta[i][r] = JSON.parse(respuesta[i][r].replaceAll('\n', ' ').replaceAll('\t',''))
                                        }
                                     } 
                                   
                                }
                            } 
                        }      
                    }
                    console.log(fecha_log() + 'WS: ' + ws);
                    //control_precios(req,200); //19/09/24 anulamos el control de precios. el error lo generaba la replica nueva
                    return res.status(200).send({
                        status: "200", ws, registros, respuesta
                    });
                }
            } catch (err) {
                //control_precios(req,500); //19/09/24 anulamos el control de precios. el error lo generaba la replica nueva
                console.error(fecha_log() + ' ERROR: ${ws}' , err);
                return res.status(500).send({
                    status: "500", ws, error: "Error interno en la peticion.",errorString
                });
            }

        } else {
            //control_precios(req,400);
            return res.status(400).send({
                status: "400", ws, error: "Faltan parametros.",
            });
        }
    }, 
         
    descargas_docs: async function (req, res) {
        //console.log(fecha_log() +  "ws_descargas");

        try{
            //console.log(fecha_log() +  "BODY: "+JSON.stringify(req.body));
            JSON.stringify(req.body);
        } catch (err) {
            console.error(fecha_log() + ' JSON ', err);
            return res.status(500).send({
                status: "500", err, error: "Error de Josep"
            });
        }
        var paramsHeader = req.headers;
        var paramsBody = req.body;
  
        try {
        var request_log = poolWeb.request(); // o: new sql.Request(pool2) enlazamos con la bbdd real para insertar el log
        var ws = paramsBody.ws;
        var xempresa_id = paramsBody.xempresa_id;
        var max_registros = paramsBody.max_registros;
        if (ws.toLowerCase() == "descarga-fichero-coa"){
        var xlote_id = paramsBody.xlote_id.replaceAll('\n', ' ').replaceAll('\t','').replaceAll('\\','').replaceAll('\\\\','').replaceAll('\r', ' ').replaceAll('\'','');
        }
        var xarticulo_id = paramsBody.xarticulo_id.replaceAll('\n', ' ').replaceAll('\t','').replaceAll('\\','').replaceAll('\\\\','').replaceAll('\r', ' ').replaceAll('\'','');
        var xemail = paramsBody.xemail.replaceAll('\n', ' ').replaceAll('\t','').replaceAll('\\','').replaceAll('\\\\','').replaceAll('\r', ' ').replaceAll('\'','');
        var xnombre = paramsBody.xnombre.replaceAll('\n', ' ').replaceAll('\t','').replaceAll('\\','').replaceAll('\\\\','').replaceAll('\r', ' ').replaceAll('\'','');
        var xapellido = paramsBody.xapellido.replaceAll('\n', ' ').replaceAll('\t','').replaceAll('\\','').replaceAll('\\\\','').replaceAll('\r', ' ').replaceAll('\'','');
      
        if (ws.toLowerCase() != "descarga-fichero-coa"){
        var xidioma = paramsBody.xidioma.replaceAll('\n', ' ').replaceAll('\t','').replaceAll('\\','').replaceAll('\\\\','').replaceAll('\r', ' ').replaceAll('\'','');
       }
    }catch (err) {
        console.error( fecha_log() + ' error transformacion Registros', err);
        return res.status(500).send({
            status: "500", err, error: "Error Interno"
        });

    }
        var consultaSqlWS='';
        var controlTdsSds=0;
        try{
        if (ws.toLowerCase() == "descarga-fichero-coa"){
            var sql_inserta = "INSERT INTO yy_www_descargas_log (xempresa_id, xfecha, xlote_id, xarticulo_id, xemail, xnombre, xapellido, xtienda_id,xws) ";
            sql_inserta += "VALUES ('SCHB', GETDATE(),'" + xlote_id + "', '" +xarticulo_id + "', '" +xemail+"', '" +xnombre+"', '" +xapellido+"','" + xempresa_id + "','"+paramsBody.ws+"');"
        }else if (ws.toLowerCase() == "descarga-fichero-sds"){
            controlTdsSds=1;
            var sql_inserta = "INSERT INTO yy_www_descargas_log (xempresa_id, xfecha, xidioma, xarticulo_id, xemail, xnombre, xapellido, xtienda_id,xws) ";
            sql_inserta += "VALUES ('SCHB', GETDATE(),'" + xidioma + "', '" +xarticulo_id + "', '" +xemail+"', '" +xnombre+"', '" +xapellido+"','" + xempresa_id + "','"+paramsBody.ws+"');"
        }else if (ws.toLowerCase() == "descarga-fichero-tds"){
            controlTdsSds=1;
            var sql_inserta = "INSERT INTO yy_www_descargas_log (xempresa_id, xfecha, xidioma, xarticulo_id, xemail, xnombre, xapellido, xtienda_id,xws) ";
            sql_inserta += "VALUES ('SCHB', GETDATE(),'" + xidioma + "', '" +xarticulo_id + "', '" +xemail+"', '" +xnombre+"', '" +paramsBody.xapellido+"','" + xempresa_id + "','"+paramsBody.ws+"');"
        }    
        var resultado_insert = await  request_log.query(sql_inserta).catch("error catch");
        
        } catch (err) {
            console.error(fecha_log() + ' INSERT error', err);
            return res.status(500).send({
                status: "500", err, error: "Error de Josep"
            });
        }
        const request = pool1.request(); 
        //buscamos la select en la tabla de parametros
        if (ws != null && xempresa_id != null) {
            var errorString ='';
            try {
                //14/10/2024. para poder mostrar todos los registros del articulo controlamos el idioma, si viene vacio, seleccionamos la consulta con -todos creada en BBDD.
                if ((controlTdsSds == 1) && (xidioma == '')){
                    consultaSqlWS = "SELECT xempresa_id, xquery, xconsulta, xparametros, xws_ekon, xcampos_objeto, xcampos_tipo_in FROM yy_ws_intranet WHERE xempresa_id = '" + xempresa_id + "' AND xquery = '" + ws + "-todos';";
                }else{
                    consultaSqlWS = "SELECT xempresa_id, xquery, xconsulta, xparametros, xws_ekon, xcampos_objeto, xcampos_tipo_in FROM yy_ws_intranet WHERE xempresa_id = '" + xempresa_id + "' AND xquery = '" + ws + "';";
                 }
                const resultadoConsultaSql = await request.query(consultaSqlWS);
                //console.log(fecha_log() +  "TOTAL DE FILAS: " + resultadoConsultaSql.recordsets[0].length);
                if (resultadoConsultaSql.recordsets[0].length == 0) {
                    return res.status(400).send({
                        status: "400", ws, error: "Peticion incorrecta"
                    });
                }

                var selectResultado = resultadoConsultaSql.recordsets[0][0].xconsulta;
                var parametrosResultado = resultadoConsultaSql.recordsets[0][0].xparametros;
                var wsEkon = resultadoConsultaSql.recordsets[0][0].xws_ekon;
                var camposObjeto = resultadoConsultaSql.recordsets[0][0].xcampos_objeto;
                var camposTipoIn = resultadoConsultaSql.recordsets[0][0].xcampos_tipo_in;
                 //leer parametros que hay definidos en "parametrosResultado" y trocearlo segun la coma que los separa
                 var parametrosResultadoSplit = parametrosResultado != null ? parametrosResultado.split(",") : null;
                 var camposTipoInSplit = camposTipoIn != null ? camposTipoIn.split(",") : '';
                 //parametros de url en json
                 const jsonParametrosBody = JSON.parse(JSON.stringify(paramsBody));
                 //comprobar que estan esos parametros en url
                 const mapaParametros = new Map();
                 for (var param in parametrosResultadoSplit) {	
                    if (jsonParametrosBody[parametrosResultadoSplit[param]] != null) {	
                        //console.log(fecha_log() +  parametrosResultadoSplit[param] + ' ---' + jsonParametrosBody[parametrosResultadoSplit[param]]);	
                        if(camposTipoInSplit.includes(parametrosResultadoSplit[param])){	
                            var d = "(";	
                            for(var i=0; i<jsonParametrosBody[parametrosResultadoSplit[param]].length; i++){	
                                d+="'"+jsonParametrosBody[parametrosResultadoSplit[param]][i]+"',";	
                            }	
                            //console.log(fecha_log() +  d);	
                            d = d.substring(0, d.length -1);	
                            d += ")";	
                            var sustituto = d;	
                            selectResultado = await selectResultado.replaceAll("{" + parametrosResultadoSplit[param] + "}", sustituto);	
                        }else{	
                            var sustituto = typeof jsonParametrosBody[parametrosResultadoSplit[param]] == 'number' ? jsonParametrosBody[parametrosResultadoSplit[param]] : "'"+jsonParametrosBody[parametrosResultadoSplit[param]]+"'";	
                            selectResultado = await selectResultado.replaceAll("{" + parametrosResultadoSplit[param] + "}", sustituto);	
                        }	
                    } else {	
                        //const parametrosResultadoSplit[param] = parametros.parametrosResultadoSplit[param];	
                        //console.log(fecha_log() +  parametrosResultadoSplit[param]);	
                        return res.status(400).send({	
                            status: "400", ws, error: "Faltan parametros"	
                        });	
                    }	
                }	

                    //sustituimos el maximos de registros si lo hay
                    var registros = 0;
                    if(max_registros != null && max_registros != ''){
                        if(typeof max_registros == 'number'){
                            selectResultado = await selectResultado.replaceAll("{max_registros}","SELECT TOP "+max_registros);
                        }else{
                            return res.status(400).send({
                                status: "400", ws, error: "Registros máximos incorrectos"
                            });
                        }
                    }else{
                        selectResultado = await selectResultado.replaceAll("{max_registros}","SELECT ");
                    }
                    //console.log(fecha_log() +  "SELECT OK: "+selectResultado);
                    //ejecutamos la select devuelta de la tabla de consultas
                    const resultadoSelectPedida = await request.query(selectResultado);
                  //console.log ("SQL: " + selectResultado);
                    var respuesta = resultadoSelectPedida.recordsets[0];
                    registros = respuesta.length;
                    if(camposObjeto != null && camposObjeto != ''){
                        //leer campos objeto que hay en el campo "camposObbjeto"
                        var camposObjetoSplit = camposObjeto != null ? camposObjeto.split(",") : '';
                        for(var i=0; i<respuesta.length; i++){
                            for (var r in respuesta[i]) {
                                if(camposObjetoSplit.includes(r)){
                                    //respuesta[i][r] = JSON.parse(respuesta[i][r].replaceAll('\n', ' ').replaceAll('\t','').replaceAll('\\','').replaceAll('\\\\','').replaceAll('\r', ' '));
                                    respuesta[i][r] = JSON.parse(respuesta[i][r]);
                                   
                                }
                            } 
                        }
                    }

                    return res.status(200).send({
                        status: "200", ws, registros, respuesta
                    });
                
            } catch (err) {
                console.error(fecha_log() + ' DescargaDocs ' + ws, err);
                errorString = err ;
                return res.status(500).send({   
                    status: "500", ws, error: "Error interno en la peticion.",errorString
                });
            }

        } else {
            return res.status(400).send({
                status: "400", err, error: "Faltan parametros.",
            });
        }
    },
    consulta_articulos_prueba: async function (req, res) {
        console.log(fecha_log() +  "consulta_articulos_prueba");
        try{
            console.log(fecha_log() +  "BODY: "+JSON.stringify(req.body));
        } catch (err) {
            console.error(fecha_log() + ' Error', err);
            return res.status(500).send({
                status: "500", ws, error: "Error de Josep"
            });
        }
        var paramsHeader = req.headers;
        var paramsBody = req.body;
           
        const ws = paramsBody.ws;
        const xempresa_id = paramsBody.xempresa_id;
        const max_registros = paramsBody.max_registros;
        //buscamos la select en la tabla de parametros
        if (ws != null && xempresa_id != null) {
            var errorString ='';
            try {
                const request = pool1.request(); // o: new sql.Request(pool1)
                const consultaSqlWS = "SELECT xempresa_id, xquery, xconsulta, xparametros, xws_ekon, xcampos_objeto, xcampos_tipo_in FROM yy_ws_intranet WHERE xempresa_id = '" + xempresa_id + "' AND xquery = '" + ws + "';";
                console.log(fecha_log() +  consultaSqlWS);
                const resultadoConsultaSql = await request.query(consultaSqlWS);
                console.log(fecha_log() +  "TOTAL DE FILAS: " + resultadoConsultaSql.recordsets[0].length);
                if (resultadoConsultaSql.recordsets[0].length == 0) {
                    return res.status(400).send({
                        status: "400", ws, error: "Peticion incorrecta"
                    });
                }

                var selectResultado = resultadoConsultaSql.recordsets[0][0].xconsulta;
                var parametrosResultado = resultadoConsultaSql.recordsets[0][0].xparametros;
                var wsEkon = resultadoConsultaSql.recordsets[0][0].xws_ekon;
                var camposObjeto = resultadoConsultaSql.recordsets[0][0].xcampos_objeto;
                var camposTipoIn = resultadoConsultaSql.recordsets[0][0].xcampos_tipo_in;
                 //leer parametros que hay definidos en "parametrosResultado" y trocearlo segun la coma que los separa
                 var parametrosResultadoSplit = parametrosResultado.split(",");
                 var camposTipoInSplit = camposTipoIn != null ? camposTipoIn.split(",") : '';
                console.log(fecha_log() +  'SPLIT:'+camposTipoInSplit);
                 //parametros de url en json
                 const jsonParametrosBody = JSON.parse(JSON.stringify(paramsBody));

                 //comprobar que estan esos parametros en url
                 const mapaParametros = new Map();
                 for (var param in parametrosResultadoSplit) {
                    if (jsonParametrosBody[parametrosResultadoSplit[param]] != null) {
                        console.log(fecha_log() +  parametrosResultadoSplit[param] + ' ---' + jsonParametrosBody[parametrosResultadoSplit[param]]);
                        if(camposTipoInSplit.includes(parametrosResultadoSplit[param])){
                            var d = "(";
                            for(var i=0; i<jsonParametrosBody[parametrosResultadoSplit[param]].length; i++){
                                d+="'"+jsonParametrosBody[parametrosResultadoSplit[param]][i]+"',";
                            }
                            console.log(fecha_log() +  d);
                            d = d.substring(0, d.length -1);
                            d += ")";
                            var sustituto = d;
                            selectResultado = await selectResultado.replaceAll("{" + parametrosResultadoSplit[param] + "}", sustituto);
                        }else{
                            var sustituto = typeof jsonParametrosBody[parametrosResultadoSplit[param]] == 'number' ? jsonParametrosBody[parametrosResultadoSplit[param]] : "'"+jsonParametrosBody[parametrosResultadoSplit[param]]+"'";
                            selectResultado = await selectResultado.replaceAll("{" + parametrosResultadoSplit[param] + "}", sustituto);
                        }
                    } else {
                        //const parametrosResultadoSplit[param] = parametros.parametrosResultadoSplit[param];
                        console.log(fecha_log() +  parametrosResultadoSplit[param]);
                        return res.status(400).send({
                            status: "400", ws, error: "Faltan parametros"
                        });
                    }
                }

                 console.log(fecha_log() +  'SELECT: '+selectResultado);
                if (wsEkon == '-1') {
                    console.log(fecha_log() +  paramsBody);
                    //llamada aun WS de Ekon donde le enviamos parametros y el mismo responde
                    var config = {
                        method: 'POST',
                        url: selectResultado,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Basic REJBV0VCOkRiYXdlYjEx'
                        },
                        data: paramsBody
                    };
                    let axiosresp = await axios(config);
            
                    let respuesta = [];
                    respuesta.push(axiosresp.data);//JSON.stringify(respuesta.data);
                    console.log(fecha_log() +  respuesta);
                    return res.status(200).send({
                        status: "200",
                        ws,
                        respuesta
                    });
                } else {
                    //sustituimos el maximos de registros si lo hay
                    var registros = 0;
                    if(max_registros != null && max_registros != ''){
                        if(typeof max_registros == 'number'){
                            selectResultado = await selectResultado.replaceAll("{max_registros}","SELECT TOP "+max_registros);
                        }else{
                            return res.status(400).send({
                                status: "400", ws, error: "Registros máximos incorrectos"
                            });
                        }
                    }else{
                        selectResultado = await selectResultado.replaceAll("{max_registros}","SELECT ");
                    }
                    //console.log(fecha_log() +  "-SELECT OK: "+selectResultado);
                    //ejecutamos la select devuelta de la tabla de consultas
                    const resultadoSelectPedida = await request.query(selectResultado);
                    //console.log(fecha_log() +  resultadoSelectPedida);
                    var respuesta = resultadoSelectPedida.recordsets[0];
                    registros = respuesta.length;
                    if(camposObjeto != null && camposObjeto != ''){
                        //leer campos objeto que hay en el campo "camposObbjeto"
                        var camposObjetoSplit = camposObjeto != null ? camposObjeto.split(",") : '';
                        for(var i=0; i<respuesta.length; i++){
                            for (var r in respuesta[i]) {
                                if(camposObjetoSplit.includes(r)){
                                    var pattern = /[\t]+/g;
                                    errorString = respuesta[i] +' >>>>><<<<< '+ respuesta[i][r];
                                   // console.log(fecha_log() +  'ANTES: '+respuesta[i][r]);
                                    respuesta[i][r] = JSON.parse(respuesta[i][r].replace('\n', ' ').replace('\'','').replace('\t','').replace('\\','').replace('\\\\','').replace('\r', ' '));
                                   // console.log(fecha_log() +  'DESPUES: '+respuesta[i][r]);
                                   
                                }
                            } 
                        }
                    }

                    var express = require("express");
                    var router = new express.Router();
                    // Here we import our Logger file and instantiate a logger object
                    var logger = require("../Logger").Logger;

                    router.use(function timeLog(req, res, next) {
                    // this is an example of how you would call our new logging system to log an info message
                    logger.info("Test Message carlos");
                    next();
                    });

                    module.exports = router;

                    return res.status(200).send({
                        status: "200", ws, registros, respuesta
                    });
                }
            } catch (err) {
                console.error(fecha_log() + ' Prueba error', err);
                return res.status(500).send({
                    status: "500", ws, error: "Error interno en la peticion.",errorString
                });
            }

        } else {
            return res.status(400).send({
                status: "400", ws, error: "Faltan parametros.",
            });
        }
    },
    ws_descarga_fras: async function (req, res) {
        const pdfsDirectory = path.join(__dirname, 'pdfs');

        app.get('/descargar-pdf/:nombrePDF', (req, res) => {
        const nombrePDF = req.params.nombrePDF;
        const filePath = path.join(pdfsDirectory, nombrePDF);

        fs.exists(filePath, (exists) => {
            if (exists) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${nombrePDF}"`);
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
            } else {
            res.status(404).send('El archivo PDF no fue encontrado.');
            }
         });
        });
    },

    marcar_articulos_actualizados: async function (req, res) {
        console.log(fecha_log() +  "actualizacion_articulos");
        await pool1Connect;
        const request = pool1.request();
        var milisegundos = Date.now();
        try{
            var tablaTemporalRegistros = "yyact_artics_temporal_intranet_"+milisegundos;
            var params = req.body;
            //Validamos que existan los parametros
            //Convierto el req.body a texto para buscar los parametros con hasOwnProperty y poder verificar que existen
            var cadena_params = JSON.parse(JSON.stringify(req.body));
            //Si no viene algun parametro lo indico en un error 400
            //console.log(fecha_log() +  cadena_params);
            if (!cadena_params.hasOwnProperty('xempresa_id') || !cadena_params.hasOwnProperty('articulos')) {
                return res.status(400).send({
                    status: "400",
                    ws: "marcar-articulos-actualizados",
                    error: "Faltan parametros"
                });
            }else{
                
                await request.query("CREATE TABLE "+tablaTemporalRegistros+" (xempresa_id VARCHAR(4), xarticulo_id VARCHAR(20))");

                //LEER LOS ARTICULOS QUE VIENEN
            
            for (var i = 0; i < params.articulos.length; i++) {
                    await request.query("INSERT INTO "+tablaTemporalRegistros+" VALUES ('"+params.xempresa_id+"','"+params.articulos[i]+"')");
                }

                const resultadoSelectPedida = await request.query("SELECT * FROM "+tablaTemporalRegistros);
                console.log(fecha_log() +  resultadoSelectPedida);
                var resultado = resultadoSelectPedida.recordsets[0];
                var registros = resultado.length;

                var update = "UPDATE yyact_artics_m_sf SET xfecha_act_magento = GETDATE(), xlog_magento = 'NODE_OK' FROM ( SELECT xempresa_id, xarticulo_id FROM "+tablaTemporalRegistros+" ) AS datos WHERE datos.xempresa_id = yyact_artics_m_sf.xempresa_id AND datos.xarticulo_id = yyact_artics_m_sf.xarticulo_id";

                var resUpdate = await request.query(update);
                var registrosActualizados = resUpdate.rowsAffected;
                await request.query("DROP TABLE "+tablaTemporalRegistros);


                return res.status(200).send({
                    status: "200",
                    ws: "marcar-articulos-actualizados",
                    respuesta: "actualizacion_articulos_ok",
                    registrosActualizados
                });
            }  
        }catch(err){
            await request.query("IF OBJECT_ID('"+tablaTemporalRegistros+"', 'U') IS NOT NULL DROP TABLE "+tablaTemporalRegistros);
            return res.status(500).send({
                status: "500", ws: "marcar-articulos-actualizados", error: "Error interno en la peticion.",
            });
        }  

    },

    guardar_nombre_fichero_coa: async function (req, res) {

        console.log(fecha_log() +  "actualizacion_articulos");
        await pool1Connect;
        const request = pool1.request();
        var milisegundos = Date.now();
        try{
            var params = req.body;
            //Validamos que existan los parametros
            //Convierto el req.body a texto para buscar los parametros con hasOwnProperty y poder verificar que existen
            var cadena_params = JSON.parse(JSON.stringify(req.body));
            //Si no viene algun parametro lo indico en un error 400
            //console.log(fecha_log() +  cadena_params);
            if (!cadena_params.hasOwnProperty('xempresa_id') || !cadena_params.hasOwnProperty('xarticulo_id') || !cadena_params.hasOwnProperty('xlote_id') || !cadena_params.hasOwnProperty('xnombre_fichero')) {
                return res.status(400).send({
                    status: "400",
                    ws: "guardar-nombre-fichero-coa",
                    error: "Faltan parametros"
                });
            }else{
                
                var update = "UPDATE pl_lotes SET yyarchivo_coa = '"+params.xnombre_fichero+"' WHERE xempresa_id = '"+params.xempresa_id+"' AND xarticulo_id = '"+params.xarticulo_id+"' AND xlote_id = '"+params.xlote_id+"'";
                console.log(fecha_log() +  update);
                 var resUpdate = await request.query(update);
                var registros_actualizados = resUpdate.rowsAffected[0];

                return res.status(200).send({
                    status: "200",
                    ws: "guardar-nombre-fichero-coa",
                    respuesta: "guardar-fichero-ok",
                    registros_actualizados
                });
            }  
        }catch(err){
            return res.status(500).send({
                status: "500", ws: "guardar-nombre-fichero-coa", error: "Error interno en la peticion.",
            });
        }  
    },

    prueba_strings: async function (req, res) {
        var params = req.body;
        var cadenaIn = params.pedidos;
       
       
        console.log(fecha_log() +  cadenaIn);
        var d = "(";
        for(var i=0; i<cadenaIn.length; i++){
            d+="'"+cadenaIn[i]+"',";
        }
        console.log(fecha_log() +  d);
        d = d.substring(0, d.length -1);
        d += ")";
        return res.status(200).send({
            status: "200", ws: "strings", respuesta : d
        });
    } ,

    busqueda_web: async function (req, res) {
        //David. 30_8_2024. añadimos un control horario para el pool1. Entre las 0 y las 2 el sistema accederá a Claranet.
        //OJO Pool 2 es BBDD Real para grabar resultados. lo ha de hacer en PROD.
        hora = new Date().getHours();
        var request = pool1.request(); // o: new sql.Request(pool1)
        if (hora >= horaInicio && hora <= horaFin){
            request = pool3.request(); // o: new sql.Request(pool1)
        }
        var paramsHeader = req.headers;
        var paramsBody = req.body;
        var xtipo = 1;
        if (paramsBody.xtipo == null){
            xtipo = 1;
        }else{
             xtipo = paramsBody.xtipo;
        }
        console.log ("xtipo: " + xtipo);
        const ws = paramsBody.ws;
        const xempresa_id = paramsBody.xempresa_id;
        const max_registros = paramsBody.max_registros;
        var xbusqueda = paramsBody.xbusqueda;
        const xbusqueda_original = paramsBody.xbusqueda;
        const xcliente_id = paramsBody.xcliente_id;
        
        try{
            const prefijo = 'telegram';
            if (xbusqueda.toLowerCase().includes(prefijo)) {
              // 3. Lanzar excepción para interrumpir el flujo normal
              throw new Error("Búsqueda " + xbusqueda.toLowerCase() + " no permitida desde : " + req.ip + " detectada.");
            }
            xbusqueda = xbusqueda.replaceAll('\n', ' ').replaceAll('\t','').replaceAll('\\','').replaceAll('\\\\','').replaceAll('\r', ' ').replaceAll('\%','').replaceAll('\'','').replaceAll(', ',' ').replaceAll(',',' ').replaceAll('\"',' ').replaceAll('.','');
                //Insertamos la busqueda del usuario
                try{
                    const request_log = poolWeb.request(); // o: new sql.Request(pool2) enlazamos con la bbdd real para insertar el log
                    var sql_inserta = "INSERT INTO yy_www_busquedas_log (xempresa_id, xfecha, xbusqueda) ";
                    sql_inserta += "VALUES ('" + xempresa_id + "', GETDATE(),'" + xbusqueda.substring(0,254) + "')";
                    var resultado_insert = request_log.query(sql_inserta);
                }catch (err) {
                    console.warn (fecha_log() + ' ERROR al insertar el registro de busqueda.', err);
                    //return res.status(500).send({
                        //status: "500", ws, error: "Error interno en la peticion.",errorString
                    //});
                }
            } catch (err) {
                console.error(fecha_log() + ' Error: ', err);
                if (err.message.startsWith('Búsqueda no permitida:') ){
                    return res.status(500).json
                        ({
                            status: 500,
                            ws,
                            error: err.message
                          });
                    
                }
                return res.status(400).send({
                    status: "400", ws, error: "Faltan parametros"
                });
            }

        //buscamos la select en la tabla de parametros
        if (ws != null && xempresa_id != null) {
            var errorString ='';
            var consultaSqlWS = '';
            try {
                if (xtipo==1){
                consultaSqlWS = "SELECT xempresa_id, xquery, xconsulta, xparametros, xws_ekon, xcampos_objeto,xcontador FROM yy_ws_intranet WHERE xempresa_id = '" + xempresa_id + "' AND xquery = '" + ws + "';";
                }else{
                    //guaramos las consultas como ws en EKon añadiendole el tipo tras un guion con el tipo
                consultaSqlWS = "SELECT xempresa_id, xquery, xconsulta, xparametros, xws_ekon, xcampos_objeto,xcontador FROM yy_ws_intranet WHERE xempresa_id = '" + xempresa_id + "' AND xquery = '" + ws + "-"+ xtipo +"';"; 
                }
                const resultadoConsultaSql = await request.query(consultaSqlWS);
                //console.log(fecha_log() +  "SQL: " + consultaSqlWS);
                if (resultadoConsultaSql.recordsets[0].length == 0) {
                    return res.status(400).send({
                        status: "400", ws, error: "Peticion incorrecta"
                    });
                }
                var necesitaContadorTotales = resultadoConsultaSql.recordsets[0][0].xcontador;
                //controlamos si la consulta utiliza otra consulta contador para saber los totales de registros previos. Para Busquedas.
                var selectResultado = resultadoConsultaSql.recordsets[0][0].xconsulta;
                var parametrosResultado = resultadoConsultaSql.recordsets[0][0].xparametros;
                var wsEkon = resultadoConsultaSql.recordsets[0][0].xws_ekon;
                var camposObjeto = resultadoConsultaSql.recordsets[0][0].xcampos_objeto;
                 //leer parametros que hay definidos en "parametrosResultado" y trocearlo segun la coma que los separa
                var parametrosResultadoSplit = parametrosResultado.split(",");

                 //parametros de url en json
                const jsonParametrosBody = JSON.parse(JSON.stringify(paramsBody));

                 //comprobar que estan esos parametros en url
                 //const mapaParametros = new Map();
                 for (var param in parametrosResultadoSplit) {
                     if (jsonParametrosBody[parametrosResultadoSplit[param]] != null) {
                         var sustituto = typeof jsonParametrosBody[parametrosResultadoSplit[param]] == 'number' ? jsonParametrosBody[parametrosResultadoSplit[param]] : "'"+jsonParametrosBody[parametrosResultadoSplit[param]]+"'";
                         selectResultado = await selectResultado.replaceAll("{" + parametrosResultadoSplit[param] + "}", sustituto);
                     } else {
                         return res.status(400).send({
                             status: "400", ws, error: "Faltan parametros"
                         });
                     }
                 }
                //sustituimos el maximos de registros si lo hay
                var registros = 0;
                    if(max_registros != null && max_registros != ''){
                        if(typeof max_registros == 'number'){
                            selectResultado = await selectResultado.replaceAll("{max_registros}","SELECT TOP "+max_registros);
                        
                        }else{
                            return res.status(400).send({
                                status: "400", ws, error: "Registros máximos incorrectos"
                            });
                        }
                    }else{
                        selectResultado = await selectResultado.replaceAll("{max_registros}","SELECT ");
                    }
                    //Añadimos los campos de busqueda extra que se necesiten: cojemos el campo xbusqueda de la select y hacemos el split
                    //Condicionamos la nueva busqueda para que solo funcione en Scharlab.
                    if (xempresa_id != 'SCHB' && xempresa_id != 'SCHX'){
                        var busquedaSplit = xbusqueda.trim().split(" ");
                    }else{
                        if (xtipo == 1){
                            var busquedaSplit = xbusqueda.replaceAll("-","").trim().split(" ");
                        }else{
                            var busquedaSplit = xbusqueda.trim().split(" ");  
                        }
                    }
                    var indexBuscar ="*";
                    //controlamos la busqueda de la primera palabra.
                    var clausulaWhere = "";
                    var contador_palabras = "";
                    //contaremos las palabras para no buscar más de 5.
                    for(var i = 0; i<busquedaSplit.length; i++){
                        if (xtipo == 1){
                            if ((busquedaSplit[i].toUpperCase().length > 3)){
                                if ((busquedaSplit[i].toUpperCase() != 'DE')&&(busquedaSplit[i].toUpperCase() != 'EN')&&(busquedaSplit[i].toUpperCase() != 'Y')&&(busquedaSplit[i].toUpperCase() != 'EL')&&(busquedaSplit[i].toUpperCase() != 'PARA')&&(busquedaSplit[i].toUpperCase() != 'POR')   ){
                                    if (indexBuscar == "*")  indexBuscar=busquedaSplit[i];
                                        if  (!busquedaSplit[i].includes("-") ){
                                            if (!busquedaSplit[i].includes(".") && !busquedaSplit[i].includes("/") ) {
                                                clausulaWhere += " AND ( CONTAINS (s.xbusqueda, '\""+busquedaSplit[i].toLowerCase()+"*\"', language 3082) ";
                                            }else{
                                                clausulaWhere += " AND ( CONTAINS (s.xbusqueda, '\""+busquedaSplit[i].toLowerCase()+"\"', language 3082) ";
                                        }
                                        if (xempresa_id=='SCHX' || xempresa_id=='SPHP'){
                                        if ( (busquedaSplit[i].toUpperCase().includes('PH')) && (busquedaSplit[i].toUpperCase().length > 2) ){
                                                clausulaWhere += " OR CONTAINS (s.xbusqueda, '\""+busquedaSplit[i].toLowerCase().replaceAll("ph","f")+"*\"', language 3082) ";
                                        }else if (busquedaSplit[i].toUpperCase().includes('F') && (busquedaSplit[i].toUpperCase().length > 2) ){
                                            clausulaWhere += " OR CONTAINS (s.xbusqueda, '\""+busquedaSplit[i].toLowerCase().replaceAll("f","ph")+"*\"', language 3082) ";
                                            }  
                                        }
                                        clausulaWhere +=" ) "; 
                                        
                                        }
                                        else if (busquedaSplit[i].includes("-")){
                                            clausulaWhere += " AND (s.xbusqueda LIKE '%"+busquedaSplit[i]+"%') ";
                                         }     
                                    }
                                }
                        } else if (xtipo ==2) { //busqueda por Referencia
                            clausulaWhere += " AND (s.xarticulo_id LIKE '"+busquedaSplit[i]+"%') ";
                        } else if (xtipo ==3) { //busqueda por CAS
                            clausulaWhere += " AND (s.n992_cas LIKE '"+busquedaSplit[i]+"%') ";
                        } else if (xtipo ==4) { //busqueda por Cross ref
                            clausulaWhere += " AND (s.xRef_cruzadas LIKE '%"+busquedaSplit[i]+"%') ";
                        } else if (xtipo ==5) { //busqueda por Ref Proveedor
                            clausulaWhere += " AND (s.xReferencia LIKE '"+busquedaSplit[i]+"%' OR s.xReferencia2 LIKE '"+busquedaSplit[i]+"%' ) ";
                        } else if (xtipo ==6) { //busqueda por Marcas
                            clausulaWhere += " AND (s.xMarca LIKE '%"+busquedaSplit[i]+"%') ";
                         }
                    }
                    if (clausulaWhere == "") {
                        return res.status(400).send({
                            status: "400", ws, error: "Faltan datos.",
                    })};
                    
                    // reemplazamos el primer campo de busqueda para poder ordenar la select.    
                    selectResultado = await selectResultado.replaceAll("{xwhere}",clausulaWhere);        
                    selectResultado = await selectResultado.replaceAll("{xindexbuscar}",indexBuscar);
                    console.log(fecha_log() +  "SELECT OK: "+selectResultado );

                    //ejecutamos la select devuelta de la tabla de consultas.
                    var resultadoSelectPedida = null;
                    resultadoSelectPedida = await request.query(selectResultado);
                    var respuesta = resultadoSelectPedida.recordsets[0];
                    registros = respuesta.length;
                    
                    if(camposObjeto != null && camposObjeto != ''){
                        //leer campos objeto que hay en el campo "camposObbjeto"
                        var camposObjetoSplit = camposObjeto != null ? camposObjeto.split(",") : '';
                        for(var i=0; i<respuesta.length; i++){
                            for (var r in respuesta[i]) {
                                if(camposObjetoSplit.includes(r)){
                                    var pattern = /[\t]+/g;
                                    respuesta[i][r] = JSON.parse(respuesta[i][r].replace('\n', ' ').replace('\'','').replace('\t','').replace('\\','').replace('\\\\','').replace('\r', ' '));
                                   
                                }
                            } 
                        }
                    }
                    //console.log(fecha_log() +  respuesta);
                    return res.status(200).send({
                        status: "200", ws, registros, respuesta   
                    });
                
            } catch (err) {
                console.error(fecha_log() + ' Busqueda Error', err);
                return res.status(500).send({
                    status: "500", ws, error: "Error interno en la peticion.",errorString
                });
            }

        } else {
            return res.status(400).send({
                status: "400", ws, error: "Faltan parametros.",
            });
        }
    },

    api_google_maps: async function (req, res) {
        var axios = require('axios');
        var qs = require('qs');
        //var paramsBody = req.params;
        var direccion = req.params.direccion;
        console.log(fecha_log() +  direccion);
        //npm start
        var data = qs.stringify({
        
        });
        var config = {
        method: 'post',
        url: 'https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyB9q-RWwM3m0XjneWFZZ99nUpKSrzZxNp8&address='+direccion,
        headers: { },
        data : data
        };

        axios(config)
        .then(function (response) {
        console.log(fecha_log() +  JSON.stringify(response.data));
        var respuesta = response.data;
        return res.status(200).send({
            direccion,respuesta
        });

        })
        .catch(function (error) {
        console.log(fecha_log() +  error);
        });

    } ,

    metodo_prueba_bbdd: async function (req, res) {

        await pool2Connect;
        
        try {
            const request = pool2.request();
            const consultaSqlWS = "SELECT xempresa_id,xarticulo_id FROM pl_articulos WHERE xempresa_id = 'SCHB'";
            
            const resultadoConsultaSql = await request.query(consultaSqlWS);
           var filas = resultadoConsultaSql.recordsets[0].length;
            return res.status(200).send({
              status: "200", filas
             });
            
        } catch (err) {
            console.error(fecha_log() + ' Prueba error', err);
            return res.status(500).send({
                status: "500", ws, error: "Error interno en la peticion.",errorString
            });
        }

    },

    descifrar_2: async function (req, res) {
        console.log(fecha_log() +  "descifrar_2");
        //Recoger los parametros de la peticion
        var params = req.body;
        //Validamos que existan los parametros
        //Convierto el req.body a texto para buscar los parametros con hasOwnProperty y poder verificar que existen
        var cadena_params = JSON.parse(JSON.stringify(req.body));
        //Si no viene algun parametro lo indico en un error 400
        if (!cadena_params.hasOwnProperty('password')) {
            //Oculto la contraseña en caso de enviar error y la contraseña se halla enviado
            if (cadena_params.password) {
                cadena_params.password = null;
            }
            return res.status(400).send({
                status: "400",
                ws: "PETICION LOGIN",
                error: "Faltan parametros"
            });
        }
        //Validar los datos :: Que no venga ningún parametro vacío
        var validar_password = !validator.isEmpty(params.password);
        //Validamos que vengan los parametros con valores
        if (!validar_password) {
            return res.status(400).send({
                status: "400",
                ws: "PETICION LOGIN",
                error: "Faltan Credenciales"
            });
        }
        //Buscar usuario que coincida con el nombre de usuario
        await pool1Connect; // Me aseguro que la pool de conexiones esta creada
        try {
            const request = pool1.request(); // o: new sql.Request(pool1)
            const password_consulta = "SELECT xpassword, xempresa_id, xcliente_id, xperfil, xrol FROM yy_ws_intranet_usu WHERE xusuario = 'inia'";
            const resultado_password_consulta = await request.query(password_consulta);
            const numero_resultados_consulta_password = resultado_password_consulta.recordset.length;
            //Si el numero de resultados es == 0 es que no se ha encontrado el usuario
            if (numero_resultados_consulta_password == 0) {
                return res.status(400).send({
                    status: "400",
                    ws: "PETICION LOGIN",
                    error: "No existe el usuario"
                });
            } else {//Si no, significa que  encuentra el usuario en la base de datos
                //Me guardo la contraseña del usuario en una variable
                //var password_usuario = resultado_password_consulta.recordset[0].xpassword;
                var empresa_usuario = resultado_password_consulta.recordset[0].xempresa_id;
                var cliente_usuario = resultado_password_consulta.recordset[0].xcliente_id;
                var perfil_usuario = resultado_password_consulta.recordset[0].xperfil;
                var rol_usuario = resultado_password_consulta.recordset[0].xrol;
                //Si la contraseña que recibo en params.password es la misma que la de la base de datos la peticion es OK 200 success
                //Comprobar la contraseña (Coincidencia de nombre de usuario / password (Bcrypt))
                //const descifrar_password_basedatos =  await cifrado.descifrar(password_usuario, "6MuOzKdenNKdNbmbW8i3ywr3t3OWgER2");
                const descifrar_password_parametros =  await cifrado.descifrar(params.password, "6MuOzKdenNKdNbmbW8i3ywr3t3OWgER2");
                //console.log(fecha_log() +  "Pass base de datos: " + descifrar_password_basedatos.toString(CryptoJS.enc.Utf8) );
                console.log(fecha_log() +  "Pass parametros: " + descifrar_password_parametros.toString(CryptoJS.enc.Utf8) );
                //console.log(fecha_log() +  params.password);
                if (descifrar_password_parametros.toString(CryptoJS.enc.Utf8) != null) {
                    var passwd = descifrar_password_parametros.toString(CryptoJS.enc.Utf8);
                    /*var user = {
                        xusuario: params.xusuario,
                        xempresa_id: empresa_usuario,
                        xcliente_id: cliente_usuario,
                        xperfil: perfil_usuario,
                        xrol: rol_usuario,
                    };
                    var usuario = 'inia';*/
                    //Generar token para devolverlo
                    return res.status(200).send({
                        status: "200",
                        passwd
                    });
                } else {
                    var passbdd = descifrar_password_basedatos.toString(CryptoJS.enc.Utf8);
                    var passin = descifrar_password_parametros.toString(CryptoJS.enc.Utf8);
                    var paramspass = params.password;
                    return res.status(400).send({
                        status: "400",
                        ws: "PETICION LOGIN",
                        error: "Password Incorrecta",
                    });
                }
            }
            //Si falla la peticion sql envio el error
        } catch (err) {
            console.error(fecha_log() + ' Descifrar error', err);
            return res.status(500).send({
                status: "500",
                ws: "PETICION LOGIN",
                error: "Error Interno en la peticion"
            });
        }
    },
    descargas: async function (req, res) {
        // batch lo utilizamos para el lote del COA y para el IDIOMA SDS_TDS
        var { type, ref, batch, email } = req.params;
        if (!type || !ref || !batch || !email) {
            // Si falta alguno, devuelve un error
            return res.status(400).send({ message: "Missing parameters." });
        }

        if (ref.length>25){
            return res.status(400).send({
                status: "401", ws, error: "Ref too long"
            })
        }
        if (batch.length>15){
            return res.status(400).send({
                status: "402", ws, error: "Batch too long"
            })
        }
        if (email.search('@') == -1){
            return res.status(400).send({
                status: "403", ws, error: "Wrong email"
            })
        }
        // en los ifs de control hay que  distinguir entre cOA y resto. Coa lleva lote y resto idioma.

        //David. habria que añadir un registro de emails para validar la descarga y controlaral. si el mail no está registrado no ha de poder entrar.
        //Para ello habrá que crear una tabla de registro. interesante guardar la IP de procedencia.
     
        var paramsHeader = req.headers;
        var paramsBody = req.body;
    
        const request_log = poolWeb.request(); // o: new sql.Request(pool2) enlazamos con la bbdd real para insertar el log
        var ws = paramsBody.ws;
        const xempresa_id = ref.isnull ? paramsBody.xempresa_id:"SCHB";
        const max_registros = paramsBody.max_registros;
        const xlote_id = ref.isnull ? paramsBody.xlote_id:batch;
        const xarticulo_id = ref.isnull ? paramsBody.xarticulo_id:ref;
        const xemail = ref.isnull ? paramsBody.xemail:email;
        //nombre y apellido no aplica en la descarga directa.
        const xnombre = paramsBody.xnombre;
        const xapellido = paramsBody.xapellido;
        type = type.toLowerCase();
        console.log(fecha_log() +  "ws_descargas. type:" + type + " Ref: " + ref + " Batch/Lang: "+batch+" email:"+email+" Empresa: "+xempresa_id);
        try{
        if( (ws == "descarga-fichero-coa") || (type=="coa") ){
            ws = "descarga-fichero-coa";
            var sql_inserta = "INSERT INTO yy_www_descargas_log (xempresa_id, xfecha, xlote_id, xarticulo_id, xemail, xnombre, xapellido, xtienda_id,xws) ";
            sql_inserta += "VALUES ('SCHB', GETDATE(),'" + xlote_id + "', '" +xarticulo_id + "', '" +xemail+"', '" +xnombre+"', '" +xapellido+"','" + xempresa_id + "','"+ws+"_GET');"
            var resultado_insert = request_log.query(sql_inserta);
        }else if ( ( ws == "descarga-fichero-sds")|| (type=="sds") ){
            ws = "descarga-fichero-sds";
            var sql_inserta = "INSERT INTO yy_www_descargas_log (xempresa_id, xfecha, xidioma, xarticulo_id, xemail, xnombre, xapellido, xtienda_id,xws) ";
            sql_inserta += "VALUES ('SCHB', GETDATE(),'" + xlote_id + "', '" +xarticulo_id + "', '" +xemail+"', '" +xnombre+"', '" +xapellido+"','" + xempresa_id + "','"+ws+"_GET');"
            //sql_inserta += "VALUES ('SCHB', GETDATE(),'" + paramsBody.xidioma + "', '" +paramsBody.xarticulo_id + "', '" +paramsBody.xemail+"', '" +paramsBody.xnombre+"', '" +paramsBody.xapellido+"','" + xempresa_id + "','"+paramsBody.ws+"');"
            var resultado_insert = request_log.query(sql_inserta);
        }else if ( (ws == "descarga-fichero-tds")|| (type=="tds") ){
            ws = "descarga-fichero-tds";
            var sql_inserta = "INSERT INTO yy_www_descargas_log (xempresa_id, xfecha, xidioma, xarticulo_id, xemail, xnombre, xapellido, xtienda_id,xws) ";
            sql_inserta += "VALUES ('SCHB', GETDATE(),'" + xlote_id + "', '" +xarticulo_id + "', '" +xemail+"', '" +xnombre+"', '" +xapellido+"','" + xempresa_id + "','"+ws+"_GET');"
            //sql_inserta += "VALUES ('SCHB', GETDATE(),'" + paramsBody.xidioma + "', '" +paramsBody.xarticulo_id + "', '" +paramsBody.xemail+"', '" +paramsBody.xnombre+"', '" +paramsBody.xapellido+"','" + xempresa_id + "','"+paramsBody.ws+"');"
            var resultado_insert = request_log.query(sql_inserta);
        }    
        }catch (err) {
            console.warn (fecha_log() + ' ERROR al insertar el registro de Descarga.', err.message);
            //return res.status(500).send({
                //status: "500", ws, error: "Error interno en la peticion.",errorString
            //});
        }
        //try {
        const request = pool1.request(); //conectamos con la replica para la consulta de datos.
        //buscamos la select en la tabla de parametros
        if (ws != null && xempresa_id != null) {
            var errorString ='';

                const consultaSqlWS = "SELECT xempresa_id, xquery, xconsulta, xparametros, xws_ekon, xcampos_objeto, xcampos_tipo_in FROM yy_ws_intranet WHERE xempresa_id = '" + xempresa_id + "' AND xquery = '" + ws + "';";
                //console.log(fecha_log() +  "CONSULTA:" + ws);
                const resultadoConsultaSql = await request.query(consultaSqlWS);
                //console.log(fecha_log() +  "TOTAL DE FILAS: " + resultadoConsultaSql.recordsets[0].length);
                if (resultadoConsultaSql.recordsets[0].length == 0) {
                    return res.status(400).send({
                        status: "400", ws, error: "Peticion incorrecta"
                    });
                }

                var selectResultado = resultadoConsultaSql.recordsets[0][0].xconsulta;
                var parametrosResultado = resultadoConsultaSql.recordsets[0][0].xparametros;
                var wsEkon = resultadoConsultaSql.recordsets[0][0].xws_ekon;
                var camposObjeto = resultadoConsultaSql.recordsets[0][0].xcampos_objeto;
                var camposTipoIn = resultadoConsultaSql.recordsets[0][0].xcampos_tipo_in;
                 //leer parametros que hay definidos en "parametrosResultado" y trocearlo segun la coma que los separa
                 var parametrosResultadoSplit = parametrosResultado != null ? parametrosResultado.split(",") : null;
                 var camposTipoInSplit = camposTipoIn != null ? camposTipoIn.split(",") : '';
                 //parametros de url en json
                 const jsonParametrosBody = JSON.parse(JSON.stringify(paramsBody));

                //Si viene de Get para descarga sin login ha de buscar con las variables declaradas. Poner un if para get o post.
                //console.log(fecha_log() +  "type: " + type);
                if (type != null){
                    if (type == 'coa'){
                        //como no tenemos JSON hemos de buscar por las variables
                        //probamos con COA. empresa, articulo y lote son los parametros que rescatamos.
                        var sustituto = typeof xempresa_id == 'number' ? xempresa_id : "'"+xempresa_id+"'";	
                        selectResultado = await selectResultado.replaceAll("{" + parametrosResultadoSplit[0] + "}", sustituto);
                        var sustituto = typeof ref == 'number' ? ref : "'"+ref+"'";	
                        selectResultado = await selectResultado.replaceAll("{" + parametrosResultadoSplit[1] + "}", sustituto);
                        var sustituto = typeof batch == 'number' ? batch : "'"+batch+"'";	
                        selectResultado = await selectResultado.replaceAll("{" + parametrosResultadoSplit[2] + "}", sustituto);
                        //ejecutamos la select devuelta de la tabla de consultas
                        const resultadoSelectPedida = await request.query(selectResultado);

                        var respuesta = resultadoSelectPedida.recordsets[0];
                    }else if ( (type == 'tds')||(type == 'sds') ){
                        var sustituto = typeof xempresa_id == 'number' ? xempresa_id : "'"+xempresa_id+"'";	
                        selectResultado = await selectResultado.replaceAll("{" + parametrosResultadoSplit[0] + "}", sustituto);
                        var sustituto = typeof ref == 'number' ? ref : "'"+ref+"'";	
                        selectResultado = await selectResultado.replaceAll("{" + parametrosResultadoSplit[1] + "}", sustituto);
                        var sustituto = typeof batch == 'number' ? batch : "'"+batch+"'";	
                        selectResultado = await selectResultado.replaceAll("{" + parametrosResultadoSplit[2] + "}", sustituto);
                        //ejecutamos la select devuelta de la tabla de consultas
                        const resultadoSelectPedida = await request.query(selectResultado);
                        var respuesta = resultadoSelectPedida.recordsets[0];
                    }
                    //var respuesta = resultadoSelectPedida.recordsets[0];
                    if (respuesta.length > 0){
                    let registros = respuesta.length;
                    //console.log(fecha_log() +  'Registros: '+ registros);
               
                        for(var i=0; i<respuesta.length; i++){
                            for (var r in respuesta[i]) {
                                //console.log(fecha_log() +  'R: '+r)
                                    var pattern = /[\t]+/g;
                                    if (r='xurl_descarga'){
                                        var html = '<!DOCTYPE html> <html> <title>Redireccionando.../Redirecting.../Reindirizzamento...</title> <meta http-equiv="refresh" content="0; ';
                                        html += 'url='+respuesta[i][r]+'"> </head> <body> <a href=';
                                        html +='"' +respuesta[i][r]+'">Click here for download</a>.</p></body> </html>';
                                    }
                                }
                            } 
                        return res.send (html);
                    }else{
                        return res.status(500).send({
                            status: "500", ws, error: "No files found with this parameters."
                        })

                     }
                }
             }
         
    },

ws_notificaciones_add: async function (req, res) {
    //David. 14-6-2024
    console.log(fecha_log() +  "Actualizar Notificaciones Cambio");
    const request = pool1.request(); 
    var params = req.body;
    var cadena_params = JSON.parse(JSON.stringify(req.body));
    //Si no viene algun parametro lo indico en un error 400
    if (!cadena_params.hasOwnProperty('xempresa_id') || !cadena_params.hasOwnProperty('xcliente_id') || !cadena_params.hasOwnProperty('xarticulo_id')) {
        return res.status(400).send({
            status: "400",
            ws: "Notificaciones de cambio.",
            error: "Faltan parametros."
        });
    }   
    var xempresa_id = params.xempresa_id == "SCHX" ? "SCHB":params.xempresa_id ;
    var xcliente_id = params.xcliente_id;
    var xarticulo_id = params.xarticulo_id;

    //Comprobamos si el articulo indicado existe en la BBDD.
    var consulta = "SELECT xempresa_id, xarticulo_id FROM pl_articulos WHERE xempresa_id = '" + xempresa_id + "' AND xarticulo_id = '" + xarticulo_id + "';";
     
    var resultadoConsultaSql = await request.query(consulta);
    console.log(fecha_log() +  "TOTAL DE FILAS. Articulos: " + resultadoConsultaSql.recordsets[0].length);
    if (resultadoConsultaSql.recordsets[0].length == 0) {
        return res.status(407).send({
            status: "407", 
            xarticulo_id, 
            error: "Este articulo no existe en nuestra base de datos."
        });
    }
        //Comprobamos si el articulo indicado esta registrado en la tabla pl_artcliente. Si existe, hacemos Update en el campo yycal_not_camb_web.

    consulta = "SELECT xempresa_id, xarticulo_id FROM pl_artcliente WHERE xempresa_id = '" + xempresa_id + "' AND xarticulo_id = '" + xarticulo_id+ "' AND xcliente_id = '" + xcliente_id + "';";
    try {
    resultadoConsultaSql = await request.query(consulta);
        console.log(fecha_log() +  "TOTAL DE FILAS. Articulo_cliente: " + resultadoConsultaSql.recordsets[0].length);
        if (resultadoConsultaSql.recordsets[0].length == 0) {
                //Si no existe hacemos un insert en pool2.
                 var sql_inserta = "INSERT INTO pl_artcliente (xempresa_id,xarticulo_id,xcliente_id,yycal_not_camb_web) ";
                 sql_inserta += "VALUES ('" + xempresa_id + "','" + xarticulo_id + "', '" +xcliente_id+"',-1);"          
                 await requesta.query(sql_inserta);

        }else {
                // hacemos UPDATE en pool2
                var sql_update = "UPDATE pl_artcliente SET yycal_not_camb_web=-1 WHERE xempresa_id = '" + xempresa_id + "' AND xarticulo_id = '" + xarticulo_id+ "' AND xcliente_id = '" + xcliente_id + "';";
                await requesta.query(sql_update);

        }
        return res.status(200).send({
            status: "200",
            ws: "Notificaciones de cambio.",
            error: "OK" 
        });
    }catch (err){
        return res.status(400).send({
            status: "400",
            ws: "Notificaciones de cambio.",
            error: "Se ha producido un error descontrolado." 
        });
    }

},
ws_notificaciones_del: async function (req, res) {
    //David. 74-6-2024
    console.log(fecha_log() +  "Actualizar Notificaciones Cambio. Cliente No quiere notificacion de producto que queria anteriormente");
    const requestadd =  pool2.request(); //conectamos con la replica para la consulta de datos.
    var params = req.body;
    var cadena_params = JSON.parse(JSON.stringify(req.body));
    //Si no viene algun parametro lo indico en un error 400
    if (!cadena_params.hasOwnProperty('xempresa_id') || !cadena_params.hasOwnProperty('xcliente_id') || !cadena_params.hasOwnProperty('xarticulo_id')) {
        return res.status(400).send({
            status: "400",
            ws: "Notificaciones de cambio.",
            error: "Faltan parametros."
        });
    }   
    var xempresa_id = params.xempresa_id == "SCHX" ? "SCHB":params.xempresa_id ;
    var xcliente_id = params.xcliente_id;
    var xarticulo_id = params.xarticulo_id;

    // hacemos UPDATE en pool2. Este metodo siempre se ejecutará con un articulo seleccionado en la web
    var sql_update = "UPDATE pl_artcliente SET yycal_not_camb_web=0 WHERE xempresa_id = '" + xempresa_id + "' AND xarticulo_id = '" + xarticulo_id+ "' AND xcliente_id = '" + xcliente_id + "';";
       try {
        await requestadd.query(sql_update);
        return res.status(200).send({
            status: "200",
            ws: "Notificaciones de cambio.",
            error: "OK" 
        });
         }catch (err){
        return res.status(400).send({
            status: "401",
            ws: "Notificaciones de cambio.",
            error: "Se ha producido un error descontrolado." 
        });
         }
    },
    ws_ia_consultas_post: async function (req, res) {
        //Comprobamos la ruta de la API test para no duplicar todo este metodo.
        //este control de api que NO utiliza el middlware. para utilizar el mid hay que hacer una funcion nueva sin next o utilzar una promise.
        // 1. Extraer API Key de cabeceras
        if (req.path.toUpperCase() == '/WS-IA-TEST-APIKEY'){
            const apiKeyCliente = req.headers['x-api-key'];
            // 2. Validar presencia de la API Key
            if (!apiKeyCliente) {
            return res.status(401).json({ error: 'API Key requerida' });
            }
            // 3. Validar coincidencia con la clave secreta
            if (apiKeyCliente !== process.env.API_KEY_SECRETA) {
            return res.status(403).json({ error: 'API Key inválida' });
            }
          }
        //David. 17_12_2024. Solicitudes para proyecrto IA.
        //David. 24_4_2025. Añadimos un pool nuevo para conectar con la replica y la busqueda para esta API en concreto.
        var request = pool_IA.request(); // o: new sql.Request(pool1)
        var paramsHeader = req.headers;
        var paramsBody = req.body;
        
        const ws = paramsBody.ws;
        const xempresa_id = paramsBody.xempresa_id;
        const max_registros = paramsBody.max_registros;
        var xbusqueda = paramsBody.xbusqueda;
        //console.log ("WS:" + ws);
        //buscamos la select en la tabla de parametros
        if (ws != null && xempresa_id != null) {
            var errorString ='';
            try {
                const consultaSqlWS = "SELECT xempresa_id, xquery, xconsulta, xparametros, xws_ekon, xcampos_objeto, xcampos_tipo_in,xcontador FROM yy_ws_intranet WHERE xempresa_id = '" + xempresa_id + "' AND xquery = '" + ws + "';";
                //console.log ("SQL:" + consultaSqlWS );
                const resultadoConsultaSql = await request.query(consultaSqlWS);
                //console.log(fecha_log() +  "TOTAL DE FILAS: " + resultadoConsultaSql.recordsets[0].length);
                if (resultadoConsultaSql.recordsets[0].length == 0) {
                    return res.status(400).send({
                        status: "400", ws, error: "Peticion incorrecta"
                    });
                }

                var xcontador = resultadoConsultaSql.recordsets[0][0].xcontador;
                var selectResultado = resultadoConsultaSql.recordsets[0][0].xconsulta;
                var parametrosResultado = resultadoConsultaSql.recordsets[0][0].xparametros;
                var wsEkon = resultadoConsultaSql.recordsets[0][0].xws_ekon;
                var camposObjeto = resultadoConsultaSql.recordsets[0][0].xcampos_objeto;
                var camposTipoIn = resultadoConsultaSql.recordsets[0][0].xcampos_tipo_in;
                 //leer parametros que hay definidos en "parametrosResultado" y trocearlo segun la coma que los separa
                 var parametrosResultadoSplit = parametrosResultado != null ? parametrosResultado.split(",") : null;
                 var camposTipoInSplit = camposTipoIn != null ? camposTipoIn.split(",") : '';
                 //parametros de url en json
                 const jsonParametrosBody = JSON.parse(JSON.stringify(paramsBody));

                 for (var param in parametrosResultadoSplit) {
                    if (jsonParametrosBody[parametrosResultadoSplit[param]] != null) {
                        var sustituto = typeof jsonParametrosBody[parametrosResultadoSplit[param]] == 'number' ? jsonParametrosBody[parametrosResultadoSplit[param]] : "'"+jsonParametrosBody[parametrosResultadoSplit[param]]+"'";
                        selectResultado = await selectResultado.replaceAll("{" + parametrosResultadoSplit[param] + "}", sustituto);
                    } else {
                        return res.status(400).send({
                            status: "400", ws, error: "Faltan parametros"
                        });
                    }
                }

                 //David. Ampliamos la busqueda a mas de una palabra. Dejamos los caracteres.
                 //xbusqueda = xbusqueda.replaceAll('\n', ' ').replaceAll('\t','').replaceAll('\\','').replaceAll('\\\\','').replaceAll('\r', ' ').replaceAll('\%','').replaceAll('\'','').replaceAll(', ',' ').replaceAll(',',' ').replaceAll('\"',' ').replaceAll('.','');
                 xbusqueda = xbusqueda.replaceAll('\n', ' ').replaceAll('\t','').replaceAll('\r', ' ').replaceAll('\%','').replaceAll(', ',' ').replaceAll(',',' ');

                 var busquedaSplit = xbusqueda.replaceAll("-","").trim().split(" ");

                 var indexBuscar ="*";
                 //controlamos la busqueda de la primera palabra.
                 var clausulaWhere = "";
                 //contaremos las palabras para no buscar más de 5.
                 for(var i = 0; i<busquedaSplit.length; i++){
                    if ((busquedaSplit[i].toUpperCase() != 'DE')&&(busquedaSplit[i].toUpperCase() != 'EN')&&(busquedaSplit[i].toUpperCase() != 'Y')&&(busquedaSplit[i].toUpperCase() != 'EL')&&(busquedaSplit[i].toUpperCase() != 'PARA')&&(busquedaSplit[i].toUpperCase() != 'POR')   ){
                                    
                        clausulaWhere += " AND ( CONTAINS (ia.xbusqueda, '\""+busquedaSplit[i].toLowerCase()+"\"', language 3082) ";
                        clausulaWhere +=" ) "; 

                     }    
                 }
                 if (clausulaWhere == "") {
                     return res.status(400).send({
                         status: "400", ws, error: "Faltan datos.",
                 })};
                 
                // reemplazamos el primer campo de busqueda para poder ordenar la select.    
                selectResultado = await selectResultado.replaceAll("{xwhere}",clausulaWhere);      
                console.log(fecha_log() +  "SELECT BUSQUEDA: "+selectResultado );
                const resultadoSelectPedida = await request.query(selectResultado);
                var respuesta = resultadoSelectPedida.recordsets[0];
                var registros = respuesta.length;
                    
                    if(camposObjeto != null && camposObjeto != ''){
                        //leer campos objeto que hay en el campo "camposObbjeto"
                        var camposObjetoSplit = camposObjeto != null ? camposObjeto.split(",") : '';     
                        for(var i=0; i<respuesta.length; i++){
                            for (var r in respuesta[i]) {
                                if(camposObjetoSplit.includes(r)){
                                    if(respuesta[i][r] != null){
                                        respuesta[i][r] = JSON.parse(respuesta[i][r].replaceAll('\n', ' ').replaceAll('\t',''))
                                     }               
                                }
                            } 
                        }      
                    }
                    console.log(fecha_log() + ' WS: ' + ws);
                    return res.status(200).send({
                        status: "200", ws, registros, respuesta
                    });
                
            } catch (err) {
                //control_precios(req,500); //19/09/24 anulamos el control de precios. el error lo generaba la replica nueva
                console.error(fecha_log() + ' ERROR: ${ws}' , err);
                return res.status(500).send({
                    status: "500", ws, error: "Error interno en la peticion.",errorString
                });
            }

        } else {
            //control_precios(req,400);
            return res.status(400).send({
                status: "400", ws, error: "Faltan parametros.",
            });
        }
    }
    
};

function fecha_log(){
    var f =  new Date();
    var fecha = f.getFullYear();
    fecha += '-' + (f.getMonth() + 1).toString(); 
    fecha += '-' + f.getDate(); 
    fecha += '//' + f.getHours();
    fecha += ':' + f.getMinutes();
    fecha += ':' + f.getSeconds();
    return fecha;
} 

async function contadorRegistros (clausulaWhere_1,xempresa_id_1,ws_1,request_1,jsonParametrosBody,parametrosResultadoSplit){
    try {
    var consSqlWS = "SELECT xempresa_id, xquery, xconsulta, xparametros, xws_ekon, xcampos_objeto FROM yy_ws_intranet WHERE xempresa_id = '" + xempresa_id_1 + "' AND xquery = '" + ws_1 + "-contador';";            
    var resConsultaSql = await request_1.query(consSqlWS);
    //console.log (consSqlWS);
    var selResultado = resConsultaSql.recordsets[0][0].xconsulta;
    //Para la busqueda de cliente, necesitamos sustiur mas campos en la select de contador, como el xcliente_id
    for (var param in parametrosResultadoSplit) {
            var sustituto = typeof jsonParametrosBody[parametrosResultadoSplit[param]] == 'number' ? jsonParametrosBody[parametrosResultadoSplit[param]] : "'"+jsonParametrosBody[parametrosResultadoSplit[param]]+"'";
            selResultado = await selResultado.replaceAll("{" + parametrosResultadoSplit[param] + "}", sustituto);
    }

    selResultado = selResultado.replaceAll("{xempresa_id}","'"+xempresa_id_1+"'");
    selResultado = selResultado.replaceAll("{xwhere}",clausulaWhere_1);

    resConsultaSql = await request_1.query(selResultado);
    }catch (err){
        console.log ("Error de Catch: " + err + " WS: " + selResultado);
        return limiteRegistrosBusqueda+1;
    }

    return resConsultaSql.recordsets[0][0].cuantos;
}

module.exports = controller;