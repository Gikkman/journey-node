var express = require('express');
module.exports = function(TokenDatabase){
	var router = express.Router();

	router.get('/', function(req, res) {
		var token = req.query.token;
		if( token ){
			var submissions = TokenDatabase.submissionsFromToken(token,
				(error) => {
					errorResponse(res, error, "Could not fetch previous submission(s)")
				},
				(submissions) => {
					res.render('form', {token: token, submission: submissions[0]});
				} 
			);			
		}				
		else
			res.redirect('auth');
	});
	return router;
}

function errorResponse(res, error, message){
	var title = error ? error.message : "";
	res.render('message', {title: title, status: 1003, message:message});
}