var express = require('express');

module.exports = function(Passport, BASE_URL){
	var router = express.Router();

	router.get('/twitch',
        Passport.authenticate(
            "twitch",
            { failureRedirect: BASE_URL + "/login" }
        ),
        (req, res) => {
            if(!req.user.verified){
                req.logout();
                res.render('error',
                           {   title: 'Authentication error',
                               status: 'Unverified email',
                               message: 'To user these servies, you need to have an email that is verified by Twitch' }
                );
                return;
            }

            // Successful authentication, redirect to the login request's origin
            var origin = req.session.req_origin;
            delete req.session.req_origin;
            if(!origin) {
                 //if origin is null or undefined, the redirect bellow will fail
                origin = BASE_URL;
            }
            console.log("--- Logged in: " + req.user.display_name + " - Navigate: " + origin);
            res.redirect(origin);
        }
    );

    router.get('/twitch/:origin', (req, res) => {
            // Store the login origin, so we can redirect there at a later time
            req.session.req_origin = BASE_URL + '/' + req.params.origin;
            res.redirect(BASE_URL + '/login');
        }
    );

	return router;
};