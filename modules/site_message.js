module.exports = () => {
    const SAFE_SYSTEMS =
        "<a target='_blank' href='https://docs.google.com/spreadsheets/d/1DjXXyCKW3KFll17OQoNuyTfY6rlpKAfMkUGYUV-bIKo/edit#gid=0'>Safe System List</a>";
	const QUEST_LOG =
        "<a target='_blank' href='https://docs.google.com/spreadsheets/d/1yr41dvejD7i3U_akhPys3Upy3HhnEMLXHCyI8B53CQQ/edit?usp=sharing'>Quest Log</a>";
	const STREAM =
        "<a target='_blank' href='https://www.twitch.tv/gikkman'>Stream</a>";


    return {
        WELCOME: {
            title: "First time welcome!",
            message:
                "<p>"
              + "This is your first time here, right? Allow me to provide you"
              + " with a brief introduction."
              + "<p>"
              + "Before making your first submission, please take your time to"
              + " check our " + SAFE_SYSTEMS + ", to make sure you do not make a"
              + " submission that we can't play. Also, if you wanna see what"
              + " we've played earler, check out our " + QUEST_LOG + "."
              + "<p>"
              + "Messages like this might appear from time to time on this page."
              + " Normally, it will be once your submission has changed state"
              + " (for example, if you win a raffle). The messages are displayed"
              + " on login, until you dismiss it by clicking outside the popup"
              + " or by clicking the 'OK' button."
              + "<p>"
              + "Happy submitting, and if there is anything you're wondering,"
              + " just ask at our " + STREAM + "."
        }
    };
};