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
		  			res.render('auth', { title: "Twitch Error 1" + error.status, url: error.error, code: error.message });
		  		},
		  		(data) => {
					Twitch.readPlayer(data.access_token, 
						(error) => {
							res.render('auth', { title: 'Twitch Error 2'+ error.status, url: error.error, code: error.message });
						},
						(data) => {
							UserDatabase.findOrCreate(data, 
								(error) => {
									console.log(error.stack);
								},
								(user) => {
									if( user.verified ){
									   	var token = TokenDatabase.prepareToken(user, 
									   		(error) => {
												console.log(error.stack)
									   		}, 
									   		(token) => {
												res.redirect('/jp/submit?token=' + token);
								   			}
								   		);
								    } else {
								    	res.render('auth_error', {name: display_name});
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