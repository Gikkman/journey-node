module.exports = function(Config){
	var mysql = require('mysql');
	var obj = {};

	var pool  = mysql.createPool({
		connectionLimit : 10,
		host     : Config.mysql_host,
		port	 : Config.mysql_port,
		user     : Config.mysql_user,
		password : Config.mysql_password,
		database : Config.mysql_schema,
        timezone: 'utc'
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

    obj.transaction = async () => {
        return new Promise((resolve, reject) => {
            pool.getConnection( function(err, conn) {
                if(err) reject(err);
                else{
                    conn.beginTransaction(function(_err) {
                        if(_err) reject(err);
                        else resolve( new Transaction(conn) );
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

function Transaction(conn){
    this.connection = conn;

    this.queryAsync = async (query, args) => {
        return new Promise((resolve, reject) => {
            this.connection.query(query, args, (err, res, fields) => {
                if(err) reject(err);
                else resolve(res);
            });
        });
    };

    this.commitAsync = async () => {
        return new Promise((resolve, reject) => {
            this.connection.commit( (err) => {
                if(err) reject(err);
                else {
                    this.connection.release();
                    this.connection = null;
                    resolve();
                }
            });
        });
    };

    this.rollbackAsync = async () => {
        return new Promise((resolve, reject) => {
            this.connection.rollback( (err) => {
                if(err) reject(err);
                else {
                    this.connection.release();
                    this.connection = null;
                    resolve();
                }
            });
        });
    };
}
