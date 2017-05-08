module.exports = function(MySQL){
	var mod = {};

	mod.createToken = async (User) => {
        // Just a semi-random hard-to-guess number
		var token = (Date.now() >> 3) * 2 + 1684;  

		//Remove a potential old token that might be clogging up the database
		await MySQL.queryAsync('DELETE FROM submissiontokens WHERE user_id=?', [User.user_id]); 
			
        //Insert the new token    
        var sql = 'INSERT INTO submissiontokens (created, user_id, token) VALUES(CURRENT_TIMESTAMP,?,?)';
        var params = [User.user_id, token];
		await MySQL.queryAsync(sql, params);
        
        return token;
	};

	mod.submissionsFromToken = async (token) => {
		return await MySQL.queryAsync(
                'SELECT s.title, s.system, s.goal, s.comments FROM gamesubmissions AS s ' + 			  								
                'INNER JOIN (SELECT user_id, token FROM submissiontokens WHERE token = ?) AS t ' +							
                'ON s.user_id = t.user_id ',    
                [token] );  
    };

	const OLD = 30*60*1000;
	mod.validateToken = async (token) => {
        var data = {};
		var rows = await MySQL.queryAsync(
                'SELECT u.user_id, u.display_name FROM submissiontokens AS t ' +
                'INNER JOIN ( SELECT user_id, display_name FROM users ) AS u ' +
                'ON t.user_id = u.user_id ' +
                'WHERE t.token = ?',
                [token] );
        //If we didn't get a token (i.e. the token didn't exist)
        if(rows.length === 0){
            data.valid = false;
        }
        //If token is too old
        else if( (new Date() - rows[0].created) > OLD){
            data.valid = false;
        } 
        //If this token is fresh enough
        else {
            data.valid = true;
            data.user_id = rows[0].user_id;
            data.display_name = rows[0].display_name;
        }
        return data;
	};

	mod.removeToken = async (token) => {
		await MySQL.queryAsync('DELETE FROM submissiontokens WHERE token = ?', [token]);
	};
	
	return mod;
};