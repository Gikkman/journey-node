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
              + " with a brief introduction o how to submit a quest to the "
              + " Journey Project."
              + "<p>"
              + "Before making your first quest submission, please take your time to"
              + " check our " + SAFE_SYSTEMS + ", to make sure you do not submit a"
              + " quest that we can't play. Also, if you wanna see what"
              + " we've played earlier, check out our " + QUEST_LOG + "."
              + "<p>"
              + "Once you've made a quest submission, it will stay in our raffle pool"
              + " until you win or manually delete it. Once your quest's"
              + " been played, if it wasn't completed, you will have the ability"
              + " to resubmit it (Gikk might also re-submit it himself). If"
              + " it was completed, or you don't want to resubmit it, you may "
              + " instead go ahead and make a new submission."
              + "<p>"
              + "Happy submitting, and if there is anything you're wondering,"
              + " just ask at our " + STREAM + "."
        },
        COMPLETED: {
            title: "Quest completed!",
            message:
                "<p>"
              + "Your quest was completed on {date}, after a playtime of"
              + " {time} (total playtime {total_time}, played {playtimes} times)!"
              + "<p>"
              + "Gikkman gave it a rating of '{rating}'. If you want to check"
              + " out the entire review, please check out the " + QUEST_LOG + "."
              + "<p>"
              + "All that is left to do now is to confirm the completion, and"
              + " then you are all set up make a new quest submission. Thanks for"
              + " contributing to the Journey Project!"
        },
        SUSPENDED: {
            title: "Quest suspended",
            message:
                "<p>"
             + "Your quest was suspended on {date}. Gikkman couldn't get it"
             + " up and running in a timely fashion, and chose to suspend it"
             + " and do some research. He will do his uttermost to get the"
             + " game running as soon as he can. "
             + "<p>"
             +"Gikkman left the following message to you:<br>"
             + "'{comment}'"
             + "<p>"
             + "Suspended games are left hanging in limbo until Gikkman"
             + " manages to get them to work. In case you don't have the"
             + " patience, you can opt to abandon the quest and submit another one."
             + " The choice is entirely up to you."
        },
        VOTED_OUT: {
            title: "Quest voted out",
            message: 
                "<p>"
             + "Your quest was voted out on {date}, after a playtime of {time}"
             + " (total playtime {total_time}, played {playtimes} times)."
             + " The vote count ended at {yes_count} Yes vs. {no_count} No."
             + "<p>"
             + "Gikkman gave it a rating of '{rating}'. If you want to check"
             + " out the entire review, please check out the " + QUEST_LOG + "."
             + "<p>"
             + "You now have the choice to either resubmit the same quest"
             + " (in which case we will continue from where we left off)"
             + " or you can chose to abandon the quest and submit another one."
             + " The choice is entirely up to you."
             + " Thanks for contributing to the Journey Project!"
        },
        VOTED_OUT_RESUBMITTED: {
            title: "Quest voted out",
            message: 
                "<p>"
             + "Your quest was voted out on {date}, after a playtime of {time}"
             + " (total playtime {total_time}, played {playtimes} times)."
             + " The vote count ended at {yes_count} Yes vs. {no_count} No."
             + "<p>"
             + "Gikkman gave it a rating of '{rating}'. If you want to check"
             + " out the entire review, please check out the " + QUEST_LOG + "."
             + "<p>"
             + "Gikkman wanted to continue the quest some more, so he chose to "
             + " auto-resubmit it. You can choose to leave it at that"
             + " (in which case we will continue from where we left off)"
             + " or you can choose to abandon the quest and submit another one. "
             + " The choice is entirely up to you."
             + " Thanks for contributing to the Journey Project!"
        }
    };
};
