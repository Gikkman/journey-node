module.exports = function(Config){
	var mysql = require('mysql');
	var obj = {};
	
	obj.query = function(query, args, callback){
		var connection = mysql.createConnection({
			host     : Config.mysql_host,
			port	 : Config.mysql_port,
			user     : Config.mysql_user,
			password : Config.mysql_password,
			database : Config.mysql_schema
		});

		//Establish connection
		connection.connect(function(err) {
			if (err) {
				console.error('Error connecting: ' + err.stack);
				return;
			} else {
				console.log("Connection OK");
				//Fire query
				connection.query(query, args, function(_err, results, fields){
					callback(_err, results);
					//Close connection
					connection.end( (__err)=>{
						if( __err){
							console.log("SQL close connection error: " + __err.stack);
						}
					});	
				});	
			}
		});
	}

	return obj;
}