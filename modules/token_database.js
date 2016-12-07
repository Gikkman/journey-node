var OLD = 30*60*1000;

module.exports = function(MySQL){
	var UUID  = require('uuid');
	var mod = {};

	mod.prepareToken = function(User, onError, onToken){
		var token = UUID();

		MySQL.query('SELECT * FROM gamesubmissions WHERE submitterID=?', //TODO: ORDER BY priority
			[User.id], 
			(err, rows) => {
				if(err)
					onError(err);
				else{
					//Remove a potential old token that might be clogging up the database
					MySQL.query('DELETE FROM submissiontokens WHERE user_id=?', 
						[User.id], 
						(_err, _rows) => {
							var insertSQL = 'INSERT INTO submissiontokens (user_id, token, display_name, num_submissions';
							var valuesSQL = 'VALUES(?,?,?,?';
							var params = [User.id, token, User.display_name, User.submission_slots];
							for(i = 0; i < rows.length; i++){
								insertSQL += ', prio' + (i+1) + 'index';
								valuesSQL += ',?';
								params.push( rows[i].index );
							}
							insertSQL += ') ';
							valuesSQL += ')';
							MySQL.query( insertSQL + valuesSQL, 
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
			}
		);
	}

	mod.submissionsFromToken = function(token, onError, onSubmissions){
		MySQL.query('SELECT s.* FROM gamesubmissions AS s '    											+ 			  								
					'INNER JOIN (SELECT * FROM submissiontokens WHERE token = ?) AS t '					+							
					'ON s.index IN (t.prio1index, t.prio2index, t.prio3index, t.prio4index, t.prio5index) '	+
					'ORDER BY s.index',											//TODO: ORDER BY priority		    
			[token],
			(err, rows) => {
				if(err)
					onError(err);
				else
					onSubmissions(rows);
			}
		);
	}

	mod.validateToken = function(token, onError, onData){
		MySQL.query('SELECT * FROM submissiontokens WHERE token = ?',
			[token],
			(err, rows) => {
				if(err)
					onError(err);
				else {
					var data = {};

					//If token is to old
					if( (new Date() - rows[0].created) > OLD){
						data.valid = false;
						onData(data);
					} 

					//If this token is fresh enough
					data.valid = true;
					data.submitterID = rows[0].playerID;
					onData(data);
				}
			}
		);
	}
	
	return mod;
}