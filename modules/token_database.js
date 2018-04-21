module.exports = function(MySQL){
	var mod = {};

	mod.createToken = async (User) => {
            // Just a semi-random hard-to-guess number
            var token = (Date.now() >> 3) * 2 + 1684;  

            //Remove a potential old token that might be clogging up the database
            await MySQL.queryAsync('DELETE FROM submissiontokens WHERE user_id=?', [User.user_id]); 
			
            //Insert the new token    
            var sql = 'INSERT INTO submissiontokens (created, user_id, token) VALUES(NOW(),?,?)';
            var params = [User.user_id, token];
            await MySQL.queryAsync(sql, params);

            return token;
	};

	const OLD = 30*60*1000;
	mod.validateToken = async (token, user_id) => {
            var data = {};
            var rows = await MySQL.queryAsync(
                'SELECT u.user_id, u.display_name FROM submissiontokens AS t ' +
                'INNER JOIN ( SELECT user_id, display_name FROM users ) AS u ' +
                'ON t.user_id = u.user_id ' +
                'WHERE t.token = ? AND t.user_id = ?',
                [token, user_id] );
            await MySQL.queryAsync(
                "DELETE from submissiontokens WHERE token = ? AND user_id = ?",
                [token, user_id]
            );
            //If we didn't get a token (i.e. the token didn't exist)
            if(rows.length === 0){
                data.valid = false;
                data.log = "Token missing";
                data.reason = 
                    "No token found. Are you using multiple tabs? " +
                    "That is the most common reason for this error. " +
                    "Reload the page and try again.";
            }
            //If token is too old
            else if( (new Date() - rows[0].created) > OLD){
                data.valid = false;
                data.log = "Token timed out";
                data.reason = 
                    "Token timed out. " +
                    "You took to long from loading this page till making a submission. " +
                    "Reload the page and try again."
            } 
            //If this token is fresh enough
            else {
                data.valid = true;
            }
            return data;
	};

	mod.removeToken = async (token) => {
		await MySQL.queryAsync('DELETE FROM submissiontokens WHERE token = ?', [token]);
	};
	
	return mod;
};