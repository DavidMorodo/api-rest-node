//Requires base de datos
const { sqlConfig,EkonSqlConfig,EkonSqlClaranet } = require('../keys');
const sql = require('mssql');
// Ejemplo de promesa
exports.conectar = async function conectarBBDD() {
    return new Promise((resolve, reject) => {
    const pool3 = new sql.ConnectionPool(EkonSqlClaranet);
    var pool3Connect =  pool3.connect();

        reject(new Error('Ocurrió un error en la operación asincrónica'));


        resolve('Operación exitosa');
      
    });
  }