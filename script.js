var express = require('express');
var mysql = require('mysql2');
var app = express();
const queryStr = 'SELECT * FROM recJson'


var connection = mysql.createConnection({
	//properties
	host:'172.26.110.115',
	user:'wsmanager',
	password:'Scharlab&1947',
	database: 'testwebservice',
	
});


connection.connect(function(err) {
	  if (err) throw err;
	});

/*
connection.connect(function(error){
	if(!error){
		console.log('Error');
	}else{
		console.log('Connection Success');
	}
});
*/

app.get('/', function(req, resp){
	//about mysql
	connection.query(queryStr, null, (error, rows, fields)=>{
		if(error){
			console.log('Error in the query');
		}else{
				console.log('Query Success\n');
				console.log(rows);
				//parse with your rows/fields
			}
	});
})

app.listen(1337);