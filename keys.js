module.exports ={
    sqlConfig : {
        user: process.env.USER_BBDD,
        password: process.env.PASSWORD_BBDD,
        database: process.env.DATA_BBDD,
        server: process.env.SERVER_BBDD_REPLICA,//replica 
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 600000
        },
        //timeout de consulta añadido por carlos. 5minutos
        requestTimeout: 600000,
        options: {
          //encrypt: true, // para conexion de azure
          trustServerCertificate: true, // Cambiar a true para local dev / self-signed certs
          cryptoCredentialsDetails: {
              minVersion: 'TLSv1'
          } 
        }
      },

      EkonSqlConfig : {
        user: process.env.USER_BBDD,
        password: process.env.PASSWORD_BBDD,
        database: process.env.DATA_BBDD_PRUEBAS,
        server: process.env.SERVER_BBDD,
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
        user: process.env.USER_BBDD,
        password: process.env.PASSWORD_BBDD,
        database: process.env.DATA_BBDD,
        //conexion Claranet.
       server: process.env.SERVER_BBDD_CLARANET,// eKON Claranet
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

      sqlWeb : {
        user: process.env.USER_BBDD,
        password: process.env.PASSWORD_BBDD,
        database: process.env.DATA_BBDD_WEB, //Este esl de TEST BUENO. en replica no hay data_unit4
        server: process.env.SERVER_BBDD_REPLICA,//replica 
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 600000
        },
        //timeout de consulta añadido por carlos. 5minutos
        requestTimeout: 600000,
        options: {
          //encrypt: true, // para conexion de azure
          trustServerCertificate: true, // Cambiar a true para local dev / self-signed certs
          cryptoCredentialsDetails: {
              minVersion: 'TLSv1'
          } 
        }
      },

      sql_IA_Incidencias : {
        user: process.env.USER_BBDD,
        password: process.env.PASSWORD_BBDD,
        database: process.env.DATA_BBDD,
        server: process.env.SERVER_BBDD_REPLICA,//replica 
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 600000
        },
        //timeout de consulta añadido por carlos. 5minutos
        requestTimeout: 600000,
        options: {
          //encrypt: true, // para conexion de azure
          trustServerCertificate: true, // Cambiar a true para local dev / self-signed certs
          cryptoCredentialsDetails: {
              minVersion: 'TLSv1'
          } 
        }
      }

};
