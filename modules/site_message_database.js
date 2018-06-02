module.exports = function(){
	var mod = {};

	mod.setSiteMessage = async (MySQL, UserID, SiteMessage, MessageData) => {
        let sql = "INSERT INTO user_site_message (user_id, created, title, message)"
                + " VALUES (?, CURRENT_TIMESTAMP, ?, ?)"
                + " ON DUPLICATE KEY UPDATE"
                + " created=VALUES(created),"
                + " title=VALUES(title),"
                + " message=VALUES(message)";
        MySQL.queryAsync(
            sql,
            [UserID, SiteMessage.title, SiteMessage.message.format(MessageData)],
            (err) =>  { if(err) console.log(err); }
        );
	};

    mod.getSiteMessage = async (MySQL, UserID) => {
        let sql = "SELECT title, message FROM user_site_message WHERE user_id = ?";
        return await MySQL.queryAsync(
            sql,
            [UserID],
            (err) =>  { if(err) console.log(err); }
        );
	};

    mod.deleteSiteMessage = async (MySQL, UserID) => {
        let sql = "DELETE FROM user_site_message WHERE user_id = ?";
        return await MySQL.queryAsync(
            sql,
            [UserID],
            (err) =>  { if(err) console.log(err); }
        );
	};

	return mod;
};