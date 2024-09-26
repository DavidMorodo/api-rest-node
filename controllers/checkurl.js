//Requires base de datos
const { sqlConfig } = require('../keys');
const { EkonSqlConfig } = require('../keys');
const sql = require('mssql');
const { assing_secondary_client } = require('../querys/querys');
const e = require('express');
const { param } = require('../routes/peticiones');
const { request } = require('express');
const pool1 = new sql.ConnectionPool(sqlConfig);
const pool2 = new sql.ConnectionPool(EkonSqlConfig);
const pool1Connect = pool1.connect();
const pool2Connect = pool2.connect();
var hora = new Date().getHours();
const request_log = pool2.request(); // o: new sql.Request(pool2) enlazamos con la bbdd real para insertar el log

var cron = require('node-cron');

const https = require('http');
const { exec } = require('child_process');

cron.schedule('*/5  * * * *',() =>{
    hora = new Date().getHours();

const url = 'http://172.26.110.127:3990/api/busqueda-web';

https.get(url, (res) => {
    console.log(new Date() + '--- El estado de la URL ${url} es: ${res.statusCode}');
   /* if (res.statusCode === 200) {
        console.log('La URL responde correctamente.');
    } else {
        console.log('La URL no responde como se esperaba, Pero está viva.');
    }*/
}).on('error', (e) => {
    console.error(new Date() + '--- Hubo un error al conectar con la URL: ${e.message}');

    var sql_inserta = "INSERT INTO yy_www_busquedas_log (xempresa_id, xfecha, xbusqueda) ";
    sql_inserta += "VALUES ('SCHB', GETDATE(),'SERVIDOR RESPALDO CAIDO')";
    var resultado_insert = request_log.query(sql_inserta);

    exec('C:\\webservice\\Reiniciar_Node_Respaldo.bat', (err, stdout, stderr) => {
        if (err) {
            console.error(new Date() + '--- Error al ejecutar el script .bat: ${err}');
            //return;
        }
        if (stderr) {
            console.error(new Date() + '--- Error en el script .bat: ${stderr}');
            //return;
        }
        console.log(new Date() + '--- Resultado del script .bat: ${stdout}');

        sql_inserta = "INSERT INTO yy_www_busquedas_log (xempresa_id, xfecha, xbusqueda) ";
        sql_inserta += "VALUES ('SCHB', GETDATE(),'SERVIDOR RESPALDO LEVANTADO')";
        resultado_insert = request_log.query(sql_inserta);
    });
})
})
;