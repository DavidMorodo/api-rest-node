
const axios = require('axios');
var controller = {
    test: async function (req, res) {
        //var params = req.body;
            var selectResultado ='http://172.26.110.207:5580/api/EKON/YYWS_SalesPrices/obtener-precios-venta-intranet';
            var paramsBody = '{"ws":"precios", "xempresa_id":"SCHB", "xcliente_id" : "01231", "xarticulo_id" : "ET0003010C", "xcantidad" : 9    }';

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
            let response =  await axios(config);
    
            let respuesta = [];
            respuesta.push(response.data);//JSON.stringify(respuesta.data);
            console.log(fecha_log() );
            console.log(response.data.prices.items);
            /*console.log(response.status);
            console.log(response.statusText);
            console.log(response.headers);
            console.log(response.config);
            return res.status(200).send({
                status: "200",
                res: "test",
                respuesta
            });
            */
    
    }
}
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
    module.exports = controller;