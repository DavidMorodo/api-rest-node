'use stict'

var jwt = require('jwt-simple');
var moment = require('moment');

exports.createToken = function(user){
    var payload = {
        usuario: user.xusuario,
        empresa_id: user.xempresa_id,
        cliente_id:user.xcliente_id,
        perfil: user.xperfil,
        rol: user.xrol,
        iat: moment().unix(),
        expkey: moment().add(1, 'days').unix
    };

    return jwt.encode(payload, 'Scha1947lau-token-secret-Tat00in3');

}
