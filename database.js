const { sqlConfig } = require('./keys');
const sql = require('mssql')

const pool1 = new sql.ConnectionPool(sqlConfig);
const pool1Connect = pool1.connect();

pool1.on('error', err => {
    if(err){
        console.error(err);
    }else{
        console.log('Conexion a la base de datos satisfactoria');
    }
})

module.exports = async function messageHandler() {
    await pool1Connect; // ensures that the pool has been created
    try {
        const request = pool1.request(); // or: new sql.Request(pool1)
        const result = await request.query('select * from testwebservice')
        console.dir(result)
        return result;
    } catch (err) {
        console.error('SQL error', err);
    }
}


