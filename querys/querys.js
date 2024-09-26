//Requires base de datos Replica
const { sqlConfig } = require('../keys');
const { EkonSqlConfig } = require('../keys');
const sql = require('mssql')
const pool1 = new sql.ConnectionPool(sqlConfig);
const pool1Connect = pool1.connect();
const pool1Disconnect = pool1.release();

//Requires base de datos Ekon
const pool2 = new sql.ConnectionPool(EkonSqlConfig);
const pool2Connect = pool2.connect();



module.exports = {
    exist_user: async function (usuario){ //Funcion que nos dice si existe o no un usuario
        //Buscar usuario que coincida con el nombre de usuario
        await pool1Connect; // Me aseguro que la pool de conexiones esta creada
        try {
            var request = pool1.request(); // o: new sql.Request(pool1)
            const password_consulta = "SELECT * FROM yy_ws_intranet_usu WHERE xusuario = '" + usuario + "'";
            const resultado_password_consulta = await request.query(password_consulta);
            const numero_resultados_consulta_password = resultado_password_consulta.recordset.length;
            //Si el numero de resultados es == 0 es que no se ha encontrado el usuario
            if (numero_resultados_consulta_password == 0) {
                await pool1Disconnect;
                return false
            } else {
                await pool1Disconnect;
                return true
            }
            //Si falla la peticion sql envio el error
        } catch (err) {
            console.error('SQL error', err);
            await pool1Disconnect;
            return error
        }
    },

    exist_user_diferent_to_clientCode: async function (xusuario, xcliente_id){ //Funcion que nos dice si existe o no un usuario diferente a su codigo de cliente
        //Buscar usuario que coincida con el nombre de usuario
        await pool1Connect; // Me aseguro que la pool de conexiones esta creada
        try {
            var request = pool1.request(); // o: new sql.Request(pool1)
            const password_consulta = "SELECT * FROM yy_ws_intranet_usu WHERE xusuario = '" + xusuario + "' AND NOT xcliente_id = '" + xcliente_id + "'";
            //console.log(password_consulta);
            const resultado_password_consulta = await request.query(password_consulta);
            //console.log(resultado_password_consulta);
            const numero_resultados_consulta_password = resultado_password_consulta.recordset.length;
            //Si el numero de resultados es == 0 es que no se ha encontrado el usuario
            if (numero_resultados_consulta_password == 0) {
                await pool1Disconnect;
                return false
            } else {
                await pool1Disconnect;
                return true
            }
            //Si falla la peticion sql envio el error
        } catch (err) {
            console.error('SQL error', err);
            await pool1Disconnect;
            return error
        }
    },

    get_user: async function (usuario){ //Funcion que nos devuelve el usuario
        //Buscar usuario que coincida con el nombre de usuario
        await pool1Connect; // Me aseguro que la pool de conexiones esta creada
        try {
            var request = pool1.request(); // o: new sql.Request(pool1)
            const query = "SELECT * FROM yy_ws_intranet_usu WHERE xusuario = '" + usuario + "'";
            const ejecutar_consulta = await request.query(query);
            if (ejecutar_consulta.length == 0) {
                await pool1Disconnect;
                //No existe el usuario
                return false
            } else {
                await pool1Disconnect;
                return ejecutar_consulta.recordset[0];
            }
            //Si falla la peticion sql envio el error
        } catch (err) {
            console.error('SQL error', err);
            await pool1Disconnect;
            return err
        }
    },

    insert_user: async function (usuario, empresa, cliente, rol, perfil, password){// Funciona que inserta un nuevo usuario en la base de datos
        //Buscar usuario que coincida con el nombre de usuario
        await pool1Connect; // Me aseguro que la pool de conexiones esta creada
        //Crear Ususuario en la base de datos
        
            var request = pool1.request(); // o: new sql.Request(pool1)
            
            const query = "INSERT INTO yy_ws_intranet_usu (xusuario, xpassword, xempresa_id, xcliente_id, xperfil, xrol ) VALUES ('"+usuario+"','"+password+"' ,'"+empresa+"', '"+cliente+"', '"+rol+"', '"+perfil+"');";
            const ejecutar_insert = await request.query(query);
            return "Usuario Registrado Correctamente"
    },

    update_user: async function (empresa, xcliente_id, xusuario, xrol, xperfil,xemail,xemail_responsable,xnombre,xapellidos, xemail_pedidos){ //Funcion que actualiza un usuario en la base de datos
        //Buscar usuario que coincida con el nombre de usuario
        await pool2Connect; // Me aseguro que la pool de conexiones esta creada
        //Actualizar Ususuario en la base de datos
        
            var request = pool2.request(); // o: new sql.Request(pool1)
            //console.log("UPDATE yy_ws_intranet_usu SET xusuario='"+newuser+"',xrol='"+xrol+"',xperfil='"+xperfil+"' WHERE xempresa_id = '"+empresa+"' AND xusuario = '"+xusuario+"' AND xcliente_id = '"+xcliente_id+"'");
            console.log("UPDATE yy_ws_intranet_usu SET xperfil = '"+xperfil+"', xrol = '"+xrol+"', xemail = '"+xemail+"', xnombre = '"+xnombre+"', xemail_responsable = '"+xemail_responsable+"', xapellidos = '"+xapellidos+"', xactivo = -1, xemail_pedidos = '"+xemail_pedidos+"' WHERE xempresa_id = '"+empresa+"' AND xusuario = '"+usuario+"' AND xcliente_id = '"+xcliente_id+"'");
            
            //const query = "UPDATE yy_ws_intranet_usu SET xusuario='"+xusuario+"',xrol='"+xrol+"',xperfil='"+xperfil+"',xpassword='"+xpassword+"' WHERE xcliente_id='"+xcliente_id+"';";
            const query = "UPDATE yy_ws_intranet_usu SET xperfil = '"+xperfil+"', xrol = '"+xrol+"', xemail = '"+xemail+"', xnombre = '"+xnombre+"', xemail_responsable = '"+xemail_responsable+"', xapellidos = '"+xapellidos+"', xactivo = -1, xemail_pedidos = '"+xemail_pedidos+"' WHERE xempresa_id = '"+empresa+"' AND xusuario = '"+usuario+"' AND xcliente_id = '"+xcliente_id+"'";
            const ejecutar_update = await request.query(query);
            return "Usuario Registrado Correctamente";
    },

    update_user_password: async function (newuser, empresa, xcliente_id, xusuario, xrol, xperfil, xpassword){ //Funcion que actualiza un usuario en la base de datos
        //Buscar usuario que coincida con el nombre de usuario
        await pool2Connect; // Me aseguro que la pool de conexiones esta creada
        //Actualizar Ususuario en la base de datos
        
            var request = pool2.request(); // o: new sql.Request(pool1)
            console.log("UPDATE yy_ws_intranet_usu SET xusuario='"+newuser+"',xrol='"+xrol+"',xperfil='"+xperfil+"',xpassword='"+xpassword+"' WHERE xempresa_id = '"+empresa+"' AND xusuario = '"+xusuario+"' AND xcliente_id = '"+xcliente_id+"'");
            //const query = "UPDATE yy_ws_intranet_usu SET xusuario='"+xusuario+"',xrol='"+xrol+"',xperfil='"+xperfil+"',xpassword='"+xpassword+"' WHERE xcliente_id='"+xcliente_id+"';";
            const query = "UPDATE yy_ws_intranet_usu SET xusuario='"+newuser+"',xrol='"+xrol+"',xperfil='"+xperfil+"',xpassword='"+xpassword+"' WHERE xempresa_id = '"+empresa+"' AND xusuario = '"+xusuario+"' AND xcliente_id = '"+xcliente_id+"'";
            const ejecutar_update = await request.query(query);
            return "Usuario Registrado Correctamente";
    },
    update_user_datos: async function (newuser, empresa, xcliente_id, xusuario, xrol, xperfil, xpassword){ //Funcion que actualiza un email y nombre desde la web via Ws.
        //Buscar usuario que coincida con el nombre de usuario
        await pool2Connect; // Me aseguro que la pool de conexiones esta creada
        //Actualizar Ususuario en la base de datos
        
            var request = pool2.request(); // o: new sql.Request(pool1)
            console.log("UPDATE yy_ws_intranet_usu SET xusuario='"+newuser+"',xrol='"+xrol+"',xperfil='"+xperfil+"',xpassword='"+xpassword+"' WHERE xempresa_id = '"+empresa+"' AND xusuario = '"+xusuario+"' AND xcliente_id = '"+xcliente_id+"'");
            //const query = "UPDATE yy_ws_intranet_usu SET xusuario='"+xusuario+"',xrol='"+xrol+"',xperfil='"+xperfil+"',xpassword='"+xpassword+"' WHERE xcliente_id='"+xcliente_id+"';";
            const query = "UPDATE yy_ws_intranet_usu SET xusuario='"+newuser+"',xrol='"+xrol+"',xperfil='"+xperfil+"',xpassword='"+xpassword+"' WHERE xempresa_id = '"+empresa+"' AND xusuario = '"+xusuario+"' AND xcliente_id = '"+xcliente_id+"'";
            const ejecutar_update = await request.query(query);
            return "Usuario Registrado Correctamente";
    },
    update_user_datos_v2: async function (empresa, xcliente_id, xusuario, xrol, xperfil,xemail,xemail_responsable,xnombre,xapellidos,xemail_pedidos){ //Funcion que actualiza un email y nombre desde la web via Ws.
        //Buscar usuario que coincida con el nombre de usuario
        await pool2Connect; // Me aseguro que la pool de conexiones esta creada
        //Actualizar Ususuario en la base de datos
        
            var request = pool2.request(); // o: new sql.Request(pool1)
            console.log("UPDATE yy_ws_intranet_usu SET xrol='"+xrol+"',xperfil='"+xperfil+"',xnombre='"+xnombre+"',xapellidos='"+xapellidos+"' ,xemail='"+xemail+"' , xemail_responsable='"+xemail_responsable+"' ,xemail_pedidos='"+xemail_pedidos+"' WHERE xempresa_id = '"+empresa+"' AND xusuario = '"+xusuario+"' AND xcliente_id = '"+xcliente_id+"'");
            //const query = "UPDATE yy_ws_intranet_usu SET xusuario='"+xusuario+"',xrol='"+xrol+"',xperfil='"+xperfil+"',xpassword='"+xpassword+"' WHERE xcliente_id='"+xcliente_id+"';";
            const query = "UPDATE yy_ws_intranet_usu SET xrol='"+xrol+"',xperfil='"+xperfil+"',xnombre='"+xnombre+"',xapellidos='"+xapellidos+"' ,xemail='"+xemail+"' , xemail_responsable='"+xemail_responsable+"' ,xemail_pedidos='"+xemail_pedidos+"',xactivo=-1 WHERE xempresa_id = '"+empresa+"' AND xusuario = '"+xusuario+"' AND xcliente_id = '"+xcliente_id+"'";
            const ejecutar_update = await request.query(query);
            return "Usuario Registrado Correctamente";
    },
    string_sql: async function (string){
        var formateado = (Object.is(string,null)?"null":"'"+string+"'");
        return formateado;
    },
    assing_secondary_client: async function (usuario, empresa, cliente, cliente_secundario){ //Funcion que asigna clientes secundarios al usuario
        //Buscar usuario que coincida con el nombre de usuario
        await pool2Connect; // Me aseguro que la pool de conexiones esta creada
        //Crear Ususuario en la base de datos
        
            var request = pool2.request(); // o: new sql.Request(pool1)
           
            
            const query = "INSERT INTO yy_ws_intra_usu_cli (xusuario, xempresa_id, xcliente_id, xcliente_id_secundario ) VALUES ('"+usuario+"','"+empresa+"' ,'"+cliente+"', '"+cliente_secundario+"');";
            await request.query(query);
            return "Usuario Asignado Correctamente"
    },
    users_list: async function (){ //Funcion que devuelve todos los usuarios registrados
        await pool1Connect; // Me aseguro que la pool de conexiones esta creada
        
            var request = pool1.request(); // o: new sql.Request(pool1)
            
            
            const query = "SELECT xusuario, xempresa_id, xcliente_id, xperfil, xrol FROM yy_ws_intranet_usu";
            
            const result = await request.query(query);
            return result.recordset;
    },
   
    user_company: async function (usuario){ //Funcion que nos devuelve la empresa principal del usuario
        await pool1Connect; // Me aseguro que la pool de conexiones esta creada
        
            var request = pool1.request(); // o: new sql.Request(pool1)
            
            const query = "SELECT xempresa_id FROM yy_ws_intranet_usu WHERE xusuario='"+usuario+"'";
            
            const result = await request.query(query);
            return result.recordset;
    },
    
    users_clients_list: async function (){ //Funcion que nos devuelve todos los clientes de un usuario incluyendo el principal
        await pool1Connect; // Me aseguro que la pool de conexiones esta creada
        
            var request = pool1.request(); // o: new sql.Request(pool1)
            
            try{
                //const query = "SELECT xusuario, xcliente_id_secundario FROM yy_ws_intra_usu_cli";
            const query = "SELECT top 100 yy_ws_intranet_usu.xusuario, yy_ws_intranet_usu.xrol, yy_ws_intranet_usu.xempresa_id, yy_ws_intranet_usu.xperfil,  xcliente_id_secundario, yy_ws_intranet_usu.xcliente_id FROM yy_ws_intranet_usu LEFT JOIN yy_ws_intra_usu_cli ON yy_ws_intranet_usu.xusuario = yy_ws_intra_usu_cli.xusuario WHERE yy_ws_intranet_usu.xempresa_id='SCHB' AND yy_ws_intranet_usu.xcliente_id = '01753';";
            
            const result = await request.query(query);
            //console.log(result);
            return result.recordset;
            }catch(err){
                console.log(err);
                return err
            }
            
    },
    
    client_name_by_code: async function (empresa, cliente){ //Funcion que nos devuelve el nombre del codigo de cliente que pertenece a una empresa
        await pool1Connect; // Me aseguro que la pool de conexiones esta creada
        
            var request = pool1.request(); // o: new sql.Request(pool1)

            const query = "SELECT xnombre FROM pc_clientes WHERE xempgen_id = '"+empresa+"' AND xcliente_id = '"+cliente+"';";
            //console.log(query);
            const result = await request.query(query);
            //console.log(result);
            return result.recordset;
    },

    verificar_empresa_cliente: async function (empresa, cliente){ //Funcion que nos devuelve un bool en base a si existe un codigo de cliente para una empresa
        //Buscar usuario que coincida con el nombre de usuario
        await pool1Connect; // Me aseguro que la pool de conexiones esta creada
        //Crear Ususuario en la base de datos
        
            var request = pool1.request(); // o: new sql.Request(pool1)
            
            const query = "SELECT * FROM pl_clientes WHERE xempresa_id = '"+empresa+"' AND xcliente_id = '"+cliente+"';";
            //console.log(query);
            const ejecutar_count = await request.query(query);
            //console.log(ejecutar_count);
            const numero_resultados = ejecutar_count.recordset.length;
            //console.log(numero_resultados);
            //Si el numero de resultados es == 0 es que no se ha encontrado el usuario
            if (numero_resultados == 0) {
                await pool1Disconnect;
                return false
            } else {
                await pool1Disconnect;
                return true
            }
    },  
    exist_company_cliente: async function (cliente, company){ //Funcion que nos dice si existe o no el conjunto de empresa y cliente en la tabla yy_ws_intranet_usu
        //Buscar usuario que coincida con el nombre de usuario
        await pool1Connect; // Me aseguro que la pool de conexiones esta creada
        try {
            var request = pool1.request(); // o: new sql.Request(pool1)
            const consulta = "SELECT * FROM yy_ws_intranet_usu WHERE (xempresa_id = '" + company + "' AND xcliente_id = '" + cliente + "')";
           // console.log('Resultado: '+consulta);
            const resultado_consulta = await request.query(consulta);
            const numero_resultados_consulta = resultado_consulta.recordset.length;
            //Si el numero de resultados es == 0 es que no se ha encontrado el usuario
            if (numero_resultados_consulta == 0) {
                await pool1Disconnect;
                return false
            } else {
                await pool1Disconnect;
                return true
            }
            //Si falla la peticion sql envio el error
        } catch (err) {
            console.error('SQL error', err);
            await pool1Disconnect;
            return error
        }
    } ,
    exist_user_company_cliente: async function (usuario, cliente, company){ //Funcion que nos dice si existe o no el conjunto de empresa y cliente en la tabla yy_ws_intranet_usu
        //Buscar usuario que coincida con el nombre de usuario
        await pool1Connect; // Me aseguro que la pool de conexiones esta creada
        try {
            var request = pool1.request(); // o: new sql.Request(pool1)
            const consulta = "SELECT * FROM yy_ws_intranet_usu WHERE xusuario = '" + usuario + "' AND xempresa_id = '" + company + "' AND xcliente_id = '" + cliente + "'";
            console.log('Resultado: '+consulta);
            const resultado_consulta = await request.query(consulta);
            const numero_resultados_consulta = resultado_consulta.recordset.length;
            //Si el numero de resultados es == 0 es que no se ha encontrado el usuario
            if (numero_resultados_consulta == 0) {
                await pool1Disconnect;
                return false
            } else {
                await pool1Disconnect;
                return true
            }
            //Si falla la peticion sql envio el error
        } catch (err) {
            console.error('SQL error', err);
            await pool1Disconnect;
            return error
        }
    },

    //cambiar el password si lo ha olvidado
    reset_user_password: async function (empresa, xcliente_id, xpassword){ //Funcion que actualiza un usuario en la base de datos
        //Buscar usuario que coincida con el nombre de usuario
        await pool2Connect; // Me aseguro que la pool de conexiones esta creada
        //Actualizar Ususuario en la base de datos
        
            var request = pool2.request(); // o: new sql.Request(pool1)
            console.log("UPDATE yy_ws_intranet_usu SET xpassword='"+xpassword+"' WHERE xempresa_id = '"+empresa+"' AND xusuario = '"+xusuario+"' AND xcliente_id = '"+xcliente_id+"'");
            //const query = "UPDATE yy_ws_intranet_usu SET xusuario='"+xusuario+"',xrol='"+xrol+"',xperfil='"+xperfil+"',xpassword='"+xpassword+"' WHERE xcliente_id='"+xcliente_id+"';";
            const query = "UPDATE yy_ws_intranet_usu SET xpassword='"+xpassword+"' WHERE xempresa_id = '"+empresa+"' AND xusuario = '"+xusuario+"' AND xcliente_id = '"+xcliente_id+"'";
            const ejecutar_update = await request.query(query);
            return "Usuario Registrado Correctamente";
    },

    //cambiar el password desde dentro la sesion
    change_user_password: async function (xusuario, empresa, xcliente_id, xemail, xpassword){ //Funcion que actualiza un usuario en la base de datos
        //Buscar usuario que coincida con el nombre de npm startusuario
        await pool2Connect; // Me aseguro que la pool de conexiones esta creada
        //Actualizar Ususuario en la base de datos
        
            var request = pool2.request(); // o: new sql.Request(pool1)
            console.log("UPDATE yy_ws_intranet_usu SET xemail = '"+xemail+"', xpassword='"+xpassword+"' WHERE xempresa_id = '"+empresa+"' AND xusuario = '"+xusuario+"' AND xcliente_id = '"+xcliente_id+"'");
            //const query = "UPDATE yy_ws_intranet_usu SET xusuario='"+xusuario+"',xrol='"+xrol+"',xperfil='"+xperfil+"',xpassword='"+xpassword+"' WHERE xcliente_id='"+xcliente_id+"';";
            const query = "UPDATE yy_ws_intranet_usu SET xemail = '"+xemail+"', xpassword='"+xpassword+"' WHERE xempresa_id = '"+empresa+"' AND xusuario = '"+xusuario+"' AND xcliente_id = '"+xcliente_id+"'";
            const ejecutar_update = await request.query(query);
            return "Usuario Registrado Correctamente";
    }
}