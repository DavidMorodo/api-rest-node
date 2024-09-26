module.exports ={
    sqlConfig : {
        user: 'imp',
        password: 'ccsccs',
        database: 'N992_DATA_UNIT4', //Este esl de TEST BUENO. en replica no hay data_unit4
        server: '172.26.0.4',// eKON
        //database: 'N992_DATA_NEW',
        //server: '172.26.110.116',//replica 
        //server: '92.54.15.197', //Claranet
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        },
        //timeout de consulta añadido por carlos. 5minutos
        requestTimeout: 60000,
        options: {
          //encrypt: true, // para conexion de azure
          trustServerCertificate: true, // Cambiar a true para local dev / self-signed certs
          cryptoCredentialsDetails: {
              minVersion: 'TLSv1'
          } 
        }
      },

      EkonSqlConfig : {
        user: 'imp',
        password: 'ccsccs',
        database: 'N992_DATA_UNIT4',
        server: '172.26.0.4',
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        },
        //timeout de consulta añadido por carlos. 5minutos
        requestTimeout: 30000,
        options: {
          //encrypt: true, // para conexion de azure
          trustServerCertificate: true, // Cambiar a true para local dev / self-signed certs
          cryptoCredentialsDetails: {
              minVersion: 'TLSv1'
          } 
        }
      },

      EkonSqlClaranet : {
        user: 'imp',
        password: 'ccsccs',
        database: 'N992_DATA_NEW',
        //conexion Claranet.
       //server: '92.54.15.197',// eKON Claranet
       server: '92.54.15.197',// eKON Claranet
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        },
        //timeout de consulta añadido por carlos. 5minutos
        requestTimeout: 30000,
        options: {
          //encrypt: true, // para conexion de azure
          trustServerCertificate: true, // Cambiar a true para local dev / self-signed certs
          cryptoCredentialsDetails: {
              minVersion: 'TLSv1'
          } 
        }
      }

};
