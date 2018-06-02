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
            current: "current",
            next: "next",
            suspended: "suspended"
        }
    };
    return state;
} ;




