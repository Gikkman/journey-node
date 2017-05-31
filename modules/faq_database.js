module.exports = function(MySQL){
	var mod = {};

	mod.getFaQ = async () => {
		let faq = await MySQL.queryAsync('SELECT topic FROM faq_questions_topic ORDER BY weight ASC'); 
        return structureFaQ(MySQL, faq);
	};
    
    mod.getCommands = async () => {
		let topics = await MySQL.queryAsync('SELECT topic FROM faq_commands_topic ORDER BY topic ASC'); 
        return structureCommands(MySQL, topics);
	};
	
	return mod;
};

/* Creates a structured FaQ object. Example:
 *  [
        {
          "topic": "Submissions",
          "data": [
            {
              "q": "How many submissions can I make?",
              "a": "You can make as many submissions as you want."
            }
          ]
        },
        {
          "topic": "Voting",
          "data": [
            {
              "q": "Can I vote?",
              "a": "Yes"
            },
            {
              "q": "When can I vote?",
              "a": "When the voting icon is visible!"
            }
          ]
        }
    ]
 *
 */
structureFaQ = async (MySQL, topics) => {
    let output = [];
    let query = 'SELECT question, answer ' + 
                'FROM faq_questions_content ' + 
                'WHERE topic = ? ORDER BY weight ASC';
    
    // Iterate all topics
    for( let i = 0; i < topics.length; i++ ){
        let node = {};
        
        // Set the topic for this node
        let topic = topics[i].topic;
        node.topic = topic;
        
        // Iterate all Q&A for this topic
        let content = await MySQL.queryAsync(query, [topic]); 
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

structureCommands = async (MySQL, topics) => {
    let output = [];
    let query = 'SELECT question, answer ' + 
                'FROM faq_content ' + 
                'WHERE topic = ? ORDER BY weight ASC';
    
    // Iterate all topics
    for( let i = 0; i < topics.length; i++ ){
        let node = {};
        
        // Set the topic for this node
        let topic = topics[i].topic;
        node.topic = topic;
        
        // Iterate all Q&A for this topic
        let content = await MySQL.queryAsync(query, [topic]); 
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