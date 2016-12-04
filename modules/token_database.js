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
								insertSQL += ', sub' + (i+1) + 'index';
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
					'ON s.index IN (t.prio1Index, t.prio2Index, t.prio3Index, t.prioIndex, t.prio5Index) '	+
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
					if(rows.created /* over 30 minutes */){
						data[valid] = false;
						onData(data);
					} 

					//If this token is fresh enough
					data[valid] = true;
					data[prio1index] = data.prio1Index;
					data[prio2index] = data.prio2Index;
					data[prio3index] = data.prio3Index;
					data[prio4index] = data.prio4Index;
					data[prio5index] = data.prio5Index;
					onData(data);
				}
			}
		);
	}
	
	return mod;
}