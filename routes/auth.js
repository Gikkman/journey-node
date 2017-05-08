var express = require('express');

module.exports = function(Passport, BASE_URL){
	var router = express.Router();

	router.get('/twitch', 
        Passport.authenticate(
            "twitch", 
            {   forceVerify:true, 
                failureRedirect: BASE_URL + "/login" }
        ), 
        (req, res) => {
            // Successful authentication, redirect to the login request's origin
            var origin = req.session.req_origin;   
            req.session.req_origin = null;
            if(!origin) {
                 //if origin is null or undefined, the redirect bellow will fail
                origin = BASE_URL; 
            }
            console.log("--- Logged in: " + req.user.display_name + " - Origin: " + origin);    
            res.redirect(origin);
        }
    );
    
    router.get('/twitch/:origin', (req, res) => {
            // Store the login origin, so we can redirect there at a later time
            req.session.req_origin = BASE_URL + '/' + req.params.origin;
            res.redirect('/auth/twitch');
        }
    );

	return router;
};