var express = require('express');
module.exports = function (TokenDatabase, GameDatabases) {
    var router = express.Router();

    router.get('/', isAuthenticated, async (req, res) => {
        try {
            var user = req.user;
            var token = await TokenDatabase.createToken(user);
            var submission = await GameDatabases.getSubmissionByUserID(user.user_id);
            var state;

            if (submission) {
                var quest = await GameDatabases.getQuestByID(submission.quest_id);

                if (quest.completed)
                    state = "Completed";
                else if (submission.voted_out)
                    state = "Voted out";
                else if (submission.state)
                    state = "Active";
                else if (quest.submitted)
                    state = "Submitted";
                else
                    state = "Error";

                submission.title = quest.title;
                submission.system = quest.system;
                submission.goal = quest.goal;
                submission.time = toHhmmss(submission.seconds_played + quest.seconds_played);
            }

            res.render('submit', {token: token, submission: submission, state: state});
        } catch (e) {
            errorResponse(res, e, "Unexpected error when setting up submission form");
        }
    });

    return router;
};

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        next();
    else
        res.redirect('/auth/twitch/submit');
}

function errorResponse(res, error, message) {
    var title = error ? error.message : "";
    res.render('error', {title: title, status: 1001, message: message});
}

function toHhmmss(sec) {
    var hours = Math.floor(sec / 3600);
    var minutes = Math.floor((sec - (hours * 3600)) / 60);
    var seconds = sec - (hours * 3600) - (minutes * 60);

    if (hours < 10)
        hours = "0" + hours;
    if (minutes < 10)
        minutes = "0" + minutes;
    if (seconds < 10)
        seconds = "0" + seconds;
    return hours + ':' + minutes + ':' + seconds;
}