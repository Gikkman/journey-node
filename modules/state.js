module.exports = function(){
	var state = {
        Q: {
            submitted: "submitted",
            completed: "completed",
            voted_out: "voted out",
            active: "active",
            abandoned: "abandoned",
            suspended: "suspended"
        },
        S: {
            submitted: "submitted",
            completed: "completed",
            voted_out: "voted out",
            active: "active",
            suspended: "suspended"
        },
        A: {
            active: "active",
            encounter: "encounter"
        }
    };
    return state;
} ;




