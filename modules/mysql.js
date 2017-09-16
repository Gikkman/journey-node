module.exports = function(Config){
	var mysql = require('mysql');
	var obj = {};

	var pool  = mysql.createPool({
		connectionLimit : 10,
		host     : Config.mysql_host,
		port	 : Config.mysql_port,
		user     : Config.mysql_user,
		password : Config.mysql_password,
		database : Config.mysql_schema
	});
	
	obj.query = function(query, args, callback){
		//Establish connection
		pool.getConnection(function(err, conn) {
			if (err) {
				console.error('Error connecting: ' + err.stack);
				return;
			} else {
				//Fire query
				conn.query(query, args, function(_err, results, fields){
					callback(_err, results);
					
					//Release connection
					conn.release();
				});	
			}
		});
	};

	obj.shutdown = function(){
		pool.end( (err) => {
			if(err){
				console.log("Error when shutting down connection pool " + new Date());
				console.log(err.stack);
			} else {
				console.log("Database shutdown successful " + new Date());
			}
		});
	};

    obj.queryAsync = async (query, args) => {
        return new Promise((resolve, reject) => {
            pool.getConnection( function(err, conn) {
                if(err) reject(err);
                else{
                    conn.query(query, args, function(_err, results, fields){
                        //Release connection
                        conn.release();

                        if(_err) reject(_err);
                        else resolve(results);
                    });
                }
            });
        });
    };
    
    obj.getPool = function(){
        return pool;
    };

	return obj;
};