module.exports = function(){
	var state = {
        Q: {
            submitted: "submitted",
            completed: "completed",
            voted_out: "voted out",
            active: "active",
            abandoned: "abandoned"
        },
        S: {
            submitted: "submitted",
            completed: "completed",
            voted_out: "voted out",
            active: "active"
        },
        A: {
            current: "current",
            next: "next"
        }
    };
    return state;
} ;




