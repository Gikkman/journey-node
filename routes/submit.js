var express = require('express');
module.exports = function(TokenDatabase){
	var router = express.Router();

	router.get('/', isAuthenticated, async (req, res) => {
        try{
            var user = req.user;          

            var token = await TokenDatabase.createToken(user);
            var submissions = await TokenDatabase.submissionsFromToken(token);

            res.render('submit', {token: token, submission: submissions[0]});
        } catch (e) {
            errorResponse(res, e, "Unexpected error when setting up submission form");
        }
	}); 
    
	return router;
};

function isAuthenticated(req, res, next){
    if(req.isAuthenticated())
        next();
    else
        res.redirect('/auth/twitch/submit');
}

function errorResponse(res, error, message){
	var title = error ? error.message : "";
	res.render('error', {title: title, status: 1001, message:message});
}