module.exports = function(MySQL){
	var obj = {};
	
	obj.selectUser = async (userID) => {
        var query = 
            "SELECT" 
          + " u.user_id, u.last_seen, u.user_name, u.display_name, u.type,"
          + " u.verified, uv.gold_current, uv.gold_lifetime, us.editor,"
          + " u.access_token, u.refresh_token "
          + " FROM users AS u"
          + " LEFT JOIN user_variables AS uv ON u.user_id = uv.user_id"
          + " LEFT JOIN user_statuses AS us ON u.user_id = us.user_id"
          + " WHERE u.user_id = ?";
        var params = [userID];
        return await MySQL.queryAsync(query, params);
    };
    
    obj.setVerifiedStatus = async (userID, status) => {
        var query = 
            "UPDATE users SET verified = ? WHERE user_id = ?";
        var params = [status, userID];
        return await MySQL.queryAsync(query, params);
    };
	
	return obj;
} ;