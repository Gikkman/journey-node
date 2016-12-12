module.exports = function(MySQL){
	var UUID  = require('uuid');
	var mod = {};

	mod.prepareToken = function(User, onError, onToken){
		var token = UUID();

		//Remove a potential old token that might be clogging up the database
		MySQL.query('DELETE FROM submissiontokens WHERE user_id=?', 
			[User.user_id], 
			(_err, _rows) => {
				var sql = 'INSERT INTO submissiontokens (created, user_id, token) VALUES(CURRENT_TIMESTAMP,?,?)';
				var params = [User.user_id, token];
				MySQL.query( sql, 
					params, 
					(err, rows) => {
						if(err)
							onError(err);
						else
							onToken(token);
					}
				);
			}
		);
	}

	mod.submissionsFromToken = function(token, onError, onSubmissions){
		MySQL.query('SELECT s.title, s.system, s.goal, s.comments FROM gamesubmissions AS s '    		 + 			  								
					'INNER JOIN (SELECT user_id, token FROM submissiontokens WHERE token = ?) AS t ' +							
					'ON s.user_id = t.user_id ',    
			[token],
			(err, rows) => {
				if(err)
					onError(err);
				else
					onSubmissions(rows);
			}
		);
	}

	var OLD = 30*60*1000;
	mod.validateToken = function(token, onError, onData){
		MySQL.query('SELECT u.user_id, u.display_name FROM submissiontokens AS t ' +
					'INNER JOIN ( SELECT user_id, display_name FROM users ) AS u ' +
					'ON t.user_id = u.user_id ' +
					'WHERE t.token = ?',
			[token],
			(err, rows) => {
				if(err)
					onError(err);
				else{
					var data = {};
					//If we didn't get a token (i.e. the token didn't exist)
					if(rows.length == 0){
						data.valid = false;
						onData(data);
					}
					//If token is too old
					else if( (new Date() - rows[0].created) > OLD){
						data.valid = false;
						onData(data);
					} 
					//If this token is fresh enough
					else {
						data.valid = true;
						data.user_id = rows[0].user_id;
						data.display_name = rows[0].display_name;
						onData(data);
					}
				}
			}
		);
	}

	mod.removeToken = function(token, onError){
		MySQL.query('DELETE FROM submissiontokens WHERE token = ?',
			[token],
			(err, rows) => {
				if( err )
					onError(err);
			}
		);
	}
	
	return mod;
}