var express = require('express');

var faq_cache = {};
var commands_cache = {};

module.exports = function(FaqDatabase){
	var router = express.Router();
    reloadCache(FaqDatabase);
    
	router.get('/', async (req, res) => {
        res.render('faq', {topics: faq_cache} );
	}); 
    
    router.get('/commands', async (req, res) => {
        res.render('commands', {topics: commands_cache} );
	}); 
    
    router.get('/reload', async (req, res) => {
        let key = req.query.key;
        if( key === 'hello'){
            await reloadCache(FaqDatabase);
            res.send("Success");
        } else {
            res.send("Fail");
        }
    });
    
    
	return router;
};

async function reloadCache(FaqDatabase){
    try{
        let newCache = await FaqDatabase.getFaQ();
        faq_cache = newCache;
    } catch (e) {
        console.error(e);
        return;
    }
}

