var TwitchStrategy = require("passport-twitch-new").Strategy;
var SiteMessageDatabase = require(global.modules + "/site_message_database")();

var SELECT_USER_QUERY =
    "SELECT"
  + " u.user_id, u.last_seen, u.user_name, u.display_name, u.type,"
  + " u.verified, uv.gold_current, uv.gold_lifetime, us.editor,"
  + " u.access_token, u.refresh_token "
  + " FROM users AS u"
  + " LEFT JOIN user_variables AS uv ON u.user_id = uv.user_id"
  + " LEFT JOIN user_statuses AS us ON u.user_id = us.user_id"
  + " WHERE u.user_id = ?";

// expose this function to our app using module.exports
module.exports = function(Passport, MySQL, Config) {
    Passport.serializeUser(function(user, done) {
        done(null, user.user_id);
    });

    Passport.deserializeUser(function(user_id, done) {
        MySQL.query(SELECT_USER_QUERY, [user_id],
        function(err, rows){
            let user = rows[0];
            user.editor = user.editor | user.type === 'mod' | user.type === 'owner';
            done(err, user);
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
         *  profile.login,
         *  profile.display_name,
         *  profile.email
         */
        function(accessToken, refreshToken, profile, done) {
            profile.accessToken = accessToken;
            profile.refreshToken = refreshToken;
            findOrCreateTwitch(profile, done, MySQL);
        }
    ));
};

function findOrCreateTwitch(profile, done, MySQL){
    let verified = true;
    let insertUpdateQuery =
        'INSERT INTO users'
            + ' (created, last_seen, user_id,'
            + '  user_name, display_name, verified,'
            + '  access_token, refresh_token)'
        + ' VALUES(CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,?,?,?,?,?,?)'
        + ' ON DUPLICATE KEY UPDATE'
            + ' last_seen=CURRENT_TIMESTAMP, verified=?,'
            + ' user_name=?, display_name=?,'
            + ' access_token=?, refresh_token=?';
    MySQL.query(
        insertUpdateQuery,
        [profile.id, profile.login, profile.display_name, verified,
            profile.accessToken, profile.refreshToken,

            verified, profile.login, profile.display_name,
            profile.accessToken, profile.refreshToken],
        (err, result) => {
            if(err)
                done(err);
            else {
                let firstLoginSQL = "UPDATE user_variables SET site_login=1 WHERE user_id = ?";
                MySQL.query(firstLoginSQL, [profile.id], (_err, _result) => {
                    if(_err) {
                        MySQL.logError(_err);
                    } else if( _result.changedRows === 1) {
                        console.log('!!! First time login detected.'
                                    + ' User: ' + profile.displayName);
                        SiteMessageDatabase.setSiteMessage(MySQL, profile.id, global._site_message.WELCOME, {})
                            .catch( (err) => console.err(err.stack));
                    }
                });
                postInsertUpdate(profile, MySQL, done);
            }
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