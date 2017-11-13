module.exports = (App, UserDatabase, URL) => {
    //=======================================================
    //==    Twitch required login check
    //=======================================================
    App.use(async function(req, res, next){
        try{
            // Only run for logged in users
            if(req.isAuthenticated() && req.user.access_token){
                // If the user is not verified, but logged in, that means
                // that the user was verified before, but has revoked access.
                if(!req.user.verified){
                    req.logout();
                    // TODO: Do we do something else than logging them out?
                } 
                
                //If the user is verified, we must re-verify them
                //(Cause twitch says so)
                else {
                    let headers = {};
                    headers['Client-ID'] = 'wel8cwxmfae2pii0djia9gv78qhc0x';
                    headers['Accept'] = 'application/vnd.twitchtv.v5+json';
                    headers['Authorization'] = 'OAuth ' + req.user.access_token;

                    const opts = {
                        hostname: 'api.twitch.tv',
                        path: '/kraken',
                        method: 'GET',
                        timeout: 5 * 1000,
                        headers: headers
                    };
                    
                    // Async lookup (to avoid client waiting)
                    http.request(opts, body => {
                        let json = JSON.parse(body);
                        if(json.token && !json.token.valid){
                            // The user has revoked the access token
                            console.log(req.user.display_name + " logged out");
                            UserDatabase.setVerifiedStatus(req.user.user_id, false);
                        } 
                    });  
                }
            }
        } catch (e) {
            console.log(e);
        }
        next();
    });
};

