module.exports = function(MySQL){
	var mod = {};

	mod.getFaQ = async () => {
		return structureFaQ(MySQL);
	};
    
    mod.getCommands = async () => {
		return structureCommands(MySQL);
	};
    
    mod.getInfoCommands = async () => {
        let data = [];
        let infoCmdQuery = 
                   "SELECT command, response FROM chat_customcommands " + 
                   "UNION " +
                   "SELECT command, response FROM chat_responsecommands";
        let content = await MySQL.queryAsync(infoCmdQuery);
        for( let i = 0; i < content.length; i++ ){
            let elem = {};
            elem.command = content[i].command;
            elem.response = content[i].response;
            data.push(elem);
        }
        return data;
    };
	
	return mod;
};

structureFaQ = async (MySQL) => {
    let categories = await MySQL.queryAsync('SELECT category FROM ' +
                                            'faq_category ' +
                                            'ORDER BY weight ASC'); 
    let output = [];
    let query = 'SELECT question, answer ' + 
                'FROM faq_content ' + 
                'WHERE category = ? ORDER BY weight ASC';
    
    // Iterate all topics
    for( let i = 0; i < categories.length; i++ ){
        let node = {};
        
        // Set the topic for this node
        let category = categories[i].category;
        node.category = category;
        
        // Iterate all Q&A for this topic
        let content = await MySQL.queryAsync(query, [category]); 
        let data = [];
        for( let j = 0; j < content.length; j++){
            let elem = {};
            elem.q = content[j].question;
            elem.a = content[j].answer;
            data.push(elem);
        }
        node.data = data;        
        output.push(node);
    }
    return output;
};

structureCommands = async (MySQL) => {
    let categories = await MySQL.queryAsync('SELECT category FROM ' +
                                            'faq_commands_category ' +
                                            'ORDER BY weight ASC'); 
    let output = [];
    let query = 'SELECT ' +
                'command, flag, parameters, example, description, ' +
                'cooldown, cooldown_mode_global AS cd_global, ' +
                'cost, editor_plus, mod_plus, owner_only ' + 
                'FROM faq_commands_content ' + 
                'WHERE category = ? ORDER BY weight ASC, flag ASC';
    
    // Iterate all topics
    for( let i = 0; i < categories.length; i++ ){
        let node = {};
        
        // Set the topic for this node
        let category = categories[i].category;
        node.category = category;
        
        // Iterate all Q&A for this topic
        let content = await MySQL.queryAsync(query, [category]); 
        let data = {};
        for( let j = 0; j < content.length; j++){
            let command = content[j].command;
            if(!data[command]) data[command] = [];
            
            let elem = {};
            elem.flag = content[j].flag;
            elem.parameters = content[j].parameters;
            elem.example = content[j].example;
            elem.description = content[j].description;
            
            let cost = content[j].cost;
            if(cost) {
                elem.cost = content[j].cost + ' Gold';
            }
            
            // Format cooldown pretty. If a higher rank is set, set the lower ones
            // 1:00:45 , 0:03:45 , 0:00:05
            let cd = content[j].cooldown;
            let h = Math.floor(cd/3600);
            let m = Math.floor(cd%3600/60);
            let s = Math.floor(cd%60);
            if( h > 0 || m > 0 || s > 0){
                elem.cooldown = h + ':' + zeroPad(m,2) + ':' + zeroPad(s,2);
                
                // Note whether cooldown is global or per-user
                let cdGlobal = content[j].cd_global;
                elem.cooldown+=' ';
                elem.cooldown+= cdGlobal === 1 ? '[G]' : '[U]';
            }
            
            let rank = 0;
            if( content[j].editor_plus ) rank = 'Editor';
            else if( content[j].mod_plus ) rank = 'Mod';
            else if( content[j].owner_only ) rank = 'Owner';
            elem.rank = rank;
            
            data[command].push(elem);
        }
        node.commands = data;        
        output.push(node);
    }
    return output;
};

function zeroPad(number, size) {
  number = number.toString();
  while (number.length < size) number = "0" + number;
  return number;
}