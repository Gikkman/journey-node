var TwitchStrategy = require("passport-twitch").Strategy;

var SELECT_USER_QUERY = 
    "SELECT " + 
        "u.user_id, u.last_seen, u.user_name, u.display_name, u.type, "+
        "u.verified, uv.gold_current, uv.gold_lifetime, us.editor " +
    "FROM users AS u " +
    "LEFT JOIN user_variables AS uv ON u.user_id = uv.user_id " +
    "LEFT JOIN user_statuses AS us ON u.user_id = us.user_id " +
    "WHERE u.user_id = ? ";

// expose this function to our app using module.exports
module.exports = function(Passport, MySQL, Config) {
    Passport.serializeUser(function(user, done) {
        done(null, user.user_id);
    });

    Passport.deserializeUser(function(user_id, done) {
        MySQL.query(SELECT_USER_QUERY, [user_id],             
        function(err, rows){
            done(err, rows[0]);
        });
    });

    // Twitch strategy for passport 
    Passport.use(new TwitchStrategy({
            clientID: Config.twitch_client_id,
            clientSecret: Config.twitch_client_secret,
            callbackURL: Config.twitch_redir_url,
            scope: "user_read"
        },
        
        /* The profile object has the following fields:
         *  profile.id,
         *  profile.username,
         *  profile.displayName,
         *  profile.email
         */        
        function(accessToken, refreshToken, profile, done) {
          findOrCreateTwitch(profile, done, MySQL);
        }
    ));
};

function findOrCreateTwitch(profile, done, MySQL){
    var verified = profile.email ? 1 : 0;
    MySQL.query('INSERT INTO users (created, last_seen, user_id, user_name, display_name, verified) VALUES(CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,?,?,?,?) ' +
				'ON DUPLICATE KEY UPDATE last_seen=CURRENT_TIMESTAMP, verified=?, user_name=?, display_name=?', 
                [profile.id, profile.username, profile.displayName, verified, verified, profile.username, profile.displayName],
                (err, rows) => {
                    if(err) 
                        done(err);
                    else
                        postInsertUpdate(profile, MySQL, done);
                }
        );
};

function postInsertUpdate(profile, MySQL, done){
    MySQL.query(SELECT_USER_QUERY, [profile.id],
        (err, rows) => {
            if( err )
                done(err);
            else
                done(null, rows[0]);
        }
    );    
}