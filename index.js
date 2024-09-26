var app = require('./app');
var port = process.env.PORT || 3999;


var server = app.listen(port,'172.26.110.127', function () {//indicar la ip de este servidor
    console.log(new Date() + 'Server is running..');
});
//server.setTimeout(300000);