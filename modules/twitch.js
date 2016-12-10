var Querystring = require('querystring');
var Https = require('https');
var Config = require(appRoot + "/config.json")[process.env.JOURNEY_CONFIG];

module.exports.readPlayer = function(access_token, callback_error, callback_data) {
	var post_options = {
	  host: 'api.twitch.tv',
	  port: '443',
	  path: '/kraken/user',
	  method: 'GET',
	  headers: {
		  "Accept": "application/vnd.twitchtv.v3+json",
		  "Authorization": "OAuth " + access_token,
		  "Client-ID": Config.twitch_client_id
		}
	};

	var post_req = Https.request(post_options, function(res) {
	  res.setEncoding('utf8');
	  res.on('data', (d) => {
	      var json = JSON.parse(d);
	      if( res.statusCode == 200 ){
	     	callback_data(json);
	 	  }
	      else {
	      	//Twitch errors has 3 fields: error, status, message
	      	callback_error(json);
	      }
	  });
	});

	// post the data
	post_req.end();
}

module.exports.authenticate = function(session_code, callback_error, callback_data) {
// Build the post string from an object
  var post_data = Querystring.stringify({
      	"client_id":     Config.twitch_client_id,
		"client_secret": Config.twitch_client_secret,
	 	"grant_type":   "authorization_code",
	 	"redirect_uri":  Config.twitch_redir_url,
	 	"code":          session_code
  });

  // An object of options to indicate where to post to
  var post_options = {
      host: 'api.twitch.tv',
      port: '443',
      path: '/kraken/oauth2/token',
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(post_data)
      }
  };

  // Set up the request
  var post_req = Https.request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', (d) => {
          var json = JSON.parse(d);
          if( res.statusCode == 200 ){
         	callback_data(json);
     	  }
          else {
          	//Twitch errors has 3 fields: error, status, message
          	callback_error(json);
          }
      });
  });

  // post the data
  post_req.write(post_data);
  post_req.end();

}

module.exports.getAuthUrl = function(state){
	var url ="https://api.twitch.tv/kraken/oauth2/authorize"
		+"?response_type=code" 
		+"&client_id="   + Config.twitch_client_id 
		+"&redirect_uri="+ Config.twitch_redir_url 
		+"&scope=user_read"
		+"&force_verify=true"
		+"&state=" + state;
	return url;
}