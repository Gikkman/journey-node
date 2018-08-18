/**
 * Author:  Gikkman
 * Created: Jul 25, 2018
 */
ALTER TABLE `journey`.`game_submission`
ADD COLUMN `dn_override` VARCHAR(45) NULL AFTER `end_date`;



ALTER TABLE `journey`.`game_active` 
ADD COLUMN `index` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `state`,
ADD COLUMN `subindex` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `index`,
ADD COLUMN `vote_timer` INT(10) UNSIGNED NULL AFTER `subindex`;


ALTER TABLE `journey`.`game_active` 
DROP INDEX `game_active_unique` ;

UPDATE journey.game_active SET `index` = (SELECT MAX(`index`) FROM gamesplayed) + 1 WHERE `system` = 'journey' AND `state` = 'current';
UPDATE journey.game_active SET `index` = (SELECT MAX(`index`) FROM gamesplayed) + 2 WHERE `system` = 'journey' AND `state` = 'next';
UPDATE journey.game_active SET `vote_timer` = 5600 WHERE uid > 0;



ALTER TABLE `journey`.`gamesplayed` 
ADD COLUMN `subindex` INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `sub_index`;
ADD COLUMN `vote_timer` INT(10) UNSIGNED NULL AFTER `subindex`;

UPDATE gamesplayed SET subindex = 1 WHERE sub_index = "B" AND `uid` > 1;

ALTER TABLE `journey`.`gamesplayed` 
DROP COLUMN `sub_index`;



INSERT INTO `journey`.`config` (`key`, `value`) VALUES ('vote_time_init', '5400');



CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `active` AS select `ga`.`index` AS `index`,`ga`.`subindex` AS `subindex`,`ga`.`state` AS `state`,`ga`.`vote_timer` AS `vote_timer`,`gs`.`seconds_played` AS `seconds_played`,`gs`.`uid` AS `s_id`,`gq`.`uid` AS `q_id`,`gs`.`state` AS `s_state`,`gq`.`state` AS `q_state`,`gq`.`title` AS `title`,`gq`.`system` AS `system`,`gq`.`goal` AS `goal` from ((`game_active` `ga` left join `game_submission` `gs` on((`ga`.`submission_id` = `gs`.`uid`))) left join `game_quest` `gq` on((`gs`.`quest_id` = `gq`.`uid`))) order by `ga`.`index`,`ga`.`subindex`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `submissions` AS select `gs`.`uid` AS `submission_id`,`gq`.`title` AS `title`,`gq`.`system` AS `system`,`gq`.`goal` AS `goal`,`gs`.`seconds_played` AS `time` from (`game_submission` `gs` left join `game_quest` `gq` on((`gs`.`quest_id` = `gq`.`uid`))) where ((`gs`.`state` = 'submitted') and isnull(`gs`.`deleted`));

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `suspended` AS select `gs`.`uid` AS `submission_id`,`gq`.`title` AS `title`,`gq`.`system` AS `system`,`gq`.`goal` AS `goal`,`gs`.`deleted` AS `deleted` from (`game_submission` `gs` left join `game_quest` `gq` on((`gs`.`quest_id` = `gq`.`uid`))) where ((`gs`.`state` = 'suspended') and isnull(`gs`.`deleted`));
