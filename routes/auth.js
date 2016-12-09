var express = require('express');

const REDIRECT_KEY = "twitch";
module.exports = function(Twitch, UserDatabase, TokenDatabase){
	var router = express.Router();

	router.get('/', (req, res) => {
		//TODO: Render a "login with twitch" page
		res.redirect('auth/twitch');
	});

	router.get('/twitch', function(req, res) {
		//If this requrest comes from Twitch's servers
		if( req.query.state == REDIRECT_KEY ) {
	  		Twitch.authenticate( req.query.code,
	  			(error) => {
	  				errorResponse(res, error, "If you do not log in with Twitch, you won't be able to make submissions")
		  		},
		  		(data) => {
					Twitch.readPlayer(data.access_token, 
						(error) => {
							errorResponse(res, error, "Error reading user data from Twitch")
						},
						(data) => {
							UserDatabase.findOrCreate(data, 
								(error) => {
									errorResponse(res, error, "Find or Create player failed")
								},
								(user) => {
									if( user.verified ){
									   	var token = TokenDatabase.prepareToken(user, 
									   		(error) => {
												errorResponse(res, error, "Could not prepare a submission token")
									   		}, 
									   		(token) => {
												res.redirect('/jp/submit?token=' + token);
								   			}
								   		);
								    } else {
								    	errorResponse(res, null, "It appears your email is not verified by Twitch. Please make sure you verify your email adres at Twitch")
								    }
								}
							);
						}
					);
		  		}	  		
	  		);
		//If this request doesn't come from Twitch's server
		} else {
		  	var url = Twitch.getAuthUrl(REDIRECT_KEY);
	  		res.redirect(url);
	  	}	
	});

	return router;
}

function errorResponse(res, error, message){
	res.render('error', {title: error.message, status: 1002, message:message});
}