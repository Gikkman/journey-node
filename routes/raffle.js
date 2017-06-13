var express = require('express');

var raffle_cache = {};

module.exports = function(RaffleDatabase){
	var router = express.Router();
    var reg = new RegExp('^\\d+$');
    
	router.get('/:index', async (req, res) => {
        let index = req.params.index;
        if( reg.test(index) ){
            let data = await getRaffleIndex(index, RaffleDatabase);
            res.render('raffle', {index: index, data: data} );
        } else {
            res.render('error', {title: "Invalid index", 
                                 message: "Could not parse index " + index});
        }
	});    
    
	return router;
};

async function getRaffleIndex(index, RaffleDatabase){
    try{
        if(!raffle_cache.index){
            let data = await RaffleDatabase.readRaffle(index);
            if(data)
                raffle_cache.index = data;
        }
        return raffle_cache.index;
    } catch (e) {
        console.error(e);
        return;
    }
}