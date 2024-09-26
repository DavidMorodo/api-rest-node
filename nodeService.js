const Service = require('node-windows').Service

/*const svc =new Service({
    name: "nodeServer__1",
    description:"Servicio servidor Webservice",
    script:"C:\\webservice\\api-rest-node\\index.js"
})*/
const svc =new Service({
    name: "checkurl_respaldoproduccion",
    description:"Servicio Webservice check control",
    script:"C:\\webservice\\api-rest-node\\controllers\\checkurl.js"
})

svc.on('install', function(){
    svc.start()
})

svc.install()