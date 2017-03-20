module.exports = function(MySQL){
	var mod = {};

	mod.findOrCreate = function(data, onError, onUser){
		var user = {};

		user._id = data._id;
		user.name = data.name;
		user.display_name = data.display_name;
		user.verified = data.email ? true : false;

		MySQL.query('INSERT INTO users (created, last_seen, user_id, user_name, display_name, verified) VALUES(CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,?,?,?,?) ' +
				    'ON DUPLICATE KEY UPDATE last_seen=CURRENT_TIMESTAMP, verified=?, display_name=?', 
			[user._id, user.name, user.display_name, user.verified, user.verified, user.display_name],
		    (err, rows) => {
		    	if( err )
		    		onError(err);
		    	else{
		    		MySQL.query('SELECT * FROM users WHERE user_id = ?', 
	    				[user._id],
	    				(_err, _rows) => {
	    					if( _err )
	    						orError(_err)
	    					else
	    						onUser( _rows[0] )
	    				}
    				);
		    	}
		    }
    	);
	}

	return mod;
}