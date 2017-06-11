var express = require('express');

var faq_cache = {};
var commands_cache = {};
var reply_commands_cache = {};

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
        await reloadCache(FaqDatabase);
        res.send("OK");
    });
    
    
	return router;
};

async function reloadCache(FaqDatabase){
    try{
        let newFaq = await FaqDatabase.getFaQ();
        faq_cache = newFaq;
        let newCmd = await FaqDatabase.getCommands();
        commands_cache = newCmd;
        let newReplies = await FaqDatabase.getInfoCommands();
        reply_commands_cache = newReplies;
    } catch (e) {
        console.error(e);
        return;
    }
}

