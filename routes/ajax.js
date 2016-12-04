var express = require('express');
module.exports = function(TokenDatabase){
	var router = express.Router();

	router.post('/submit', (req, res) => {
		try{
			var token      = req.body.token;
			TokenDatabase.validateToken(token,
				(error) => {

				},
				(token_data) => {
					if( !token_data.valid ){
						res.send("ERR");
					} else {
						var sub1       = req.body.i1;
						var submission1 = JSON.stringify(sub1);

						console.log('Token: ' + token);
						console.log('Sub1 should replace: ' + token_data.prio1Index);
						console.log('Sub1: ' + submission1);

						res.send('SUCC');
					}
				}
			);		
		} catch(err) {
			res.send("ERR");
		}
	});
	return router;
}