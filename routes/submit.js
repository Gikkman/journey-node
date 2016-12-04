var express = require('express');
module.exports = function(TokenDatabase){
	var router = express.Router();

	router.get('/', function(req, res) {
		var token = req.query.token;
		if( token ){
			var submissions = TokenDatabase.submissionsFromToken(token,
				(error) => {
					console.log(error);
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