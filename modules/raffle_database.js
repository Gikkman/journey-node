module.exports = function(MySQL){
	var obj = {};

	obj.readRaffle = async (raffle_id) => {
        let data = {};
        let winner = await MySQL.queryAsync(
                        "SELECT winning_ticket" 
                      + " FROM raffle_win" 
                      + " WHERE raffle_id=?", 
                        [raffle_id] );
        if(winner.length === 0) return;

        let tickets = await MySQL.queryAsync(
                            "SELECT ticket_id, display_name, reason" 
                          + " FROM raffle_ticket AS rt" 
                          + " LEFT JOIN users AS u" 
                          + " ON rt.user_id = u.user_id "
                          + " WHERE raffle_id=? "
                          + " ORDER BY display_name, ticket_id",
                            [raffle_id] );
        let blocked = await MySQL.queryAsync(
                            "SELECT display_name, reason" 
                          + " FROM raffle_blocked AS rb" 
                          + " LEFT JOIN users AS u" 
                          + " ON rb.user_id = u.user_id"
                          + " WHERE raffle_id=?"
                          + " ORDER BY reason",
                            [raffle_id] );


        data.winning_ticket = winner[0].winning_ticket;
        data.tickets = tickets;
        data.blocked = blocked;
        return data;
	};
    
	return obj;
} ;


