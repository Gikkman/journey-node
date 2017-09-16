module.exports = function(Http){
	var obj = {};
    
    obj.requestAsync = async (options) => {
        return new Promise((resolve, reject) => {
            try{
                let request = Http.request(options, (res) => {
                    res.setEncoding('utf8');		
                    res.on('data', (d) => {		
                        resolve(d);	
                    });
                    res.on('error', (e) => {
                       reject(e); 
                    });
                });
                request.end();
            } catch(e) {
                reject(e);
            };
        });
    };
    
    obj.request = (options, cb) => {
        let request = Http.request(options, (res) => {
            res.setEncoding('utf8');		
            res.on('data', (d) => {		
                cb(d);
            });
            res.on('error', (e) => {
                let exception = JSON.parse(e);
                console.log('Request to '+exception.address+':'+exception.port+' timed out');
             });
        });
        request.end();
    };

	return obj;
};

//var post_options = {		
//    host: 'api.twitch.tv',		
//    port: '443',		
//    path: '/kraken',		
//    method: 'GET',		
//    headers: {		
//        "Accept": "application/vnd.twitchtv.v5+json",		
//        "Authorization": 'OAuth ' + <token>,		
//        "Client-ID": <ID>		
//    }		
//};