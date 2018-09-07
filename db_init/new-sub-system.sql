USE `journey`;

ALTER TABLE `journey`.`game_submission`
ADD COLUMN `dn_override` VARCHAR(45) NULL AFTER `end_date`;



ALTER TABLE `journey`.`game_active` 
ADD COLUMN `index` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `state`,
ADD COLUMN `subindex` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `index`,
ADD COLUMN `vote_timer` INT(10) UNSIGNED NULL AFTER `subindex`;


ALTER TABLE `journey`.`game_active` 
DROP INDEX `game_active_unique` ;

UPDATE `journey`.`game_active`  SET `index` = (SELECT MAX(`index`) FROM gamesplayed) + 1 WHERE `system` = 'journey' AND `state` = 'current';
UPDATE `journey`.`game_active`  SET `index` = (SELECT MAX(`index`) FROM gamesplayed) + 2 WHERE `system` = 'journey' AND `state` = 'next';
UPDATE `journey`.`game_active`  SET `vote_timer` = 5220 WHERE uid > 0;



ALTER TABLE `journey`.`gamesplayed` 
ADD COLUMN `submission_id` INT(10) UNSIGNED NOT NULL AFTER `uid`,
ADD COLUMN `subindex` INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `sub_index`;

UPDATE `journey`.`gamesplayed` SET subindex = 1 WHERE sub_index = "B" AND `uid` > 1;
UPDATE `journey`.`gamesplayed` SET `title`='Tomba! 2' WHERE `uid`='196';
UPDATE `journey`.`gamesplayed` SET `title`='FTL: Faster than light' WHERE `uid`='258';

ALTER TABLE `journey`.`gamesplayed` 
DROP COLUMN `sub_index`,
ADD UNIQUE INDEX `key_unique_index_subindex` (`index` ASC, `subindex` ASC);



INSERT INTO `journey`.`config` (`key`, `value`) VALUES ('vote_time_init', '5220');



CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `active` AS select `ga`.`index` AS `index`,`ga`.`subindex` AS `subindex`,`ga`.`state` AS `state`,`ga`.`vote_timer` AS `vote_timer`,`gs`.`seconds_played` AS `seconds_played`,`gs`.`uid` AS `s_id`,`gq`.`uid` AS `q_id`,`gs`.`state` AS `s_state`,`gq`.`state` AS `q_state`,`gq`.`title` AS `title`,`gq`.`system` AS `system`,`gq`.`goal` AS `goal` from ((`game_active` `ga` left join `game_submission` `gs` on((`ga`.`submission_id` = `gs`.`uid`))) left join `game_quest` `gq` on((`gs`.`quest_id` = `gq`.`uid`))) order by `ga`.`index`,`ga`.`subindex`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `submissions` AS select `gs`.`uid` AS `submission_id`,`gq`.`title` AS `title`,`gq`.`system` AS `system`,`gq`.`goal` AS `goal`,`gs`.`seconds_played` AS `time` from (`game_submission` `gs` left join `game_quest` `gq` on((`gs`.`quest_id` = `gq`.`uid`))) where ((`gs`.`state` = 'submitted') and isnull(`gs`.`deleted`));
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `suspended` AS select `gs`.`uid` AS `submission_id`,`gq`.`title` AS `title`,`gq`.`system` AS `system`,`gq`.`goal` AS `goal`,`gs`.`deleted` AS `deleted` from (`game_submission` `gs` left join `game_quest` `gq` on((`gs`.`quest_id` = `gq`.`uid`))) where ((`gs`.`state` = 'suspended') and isnull(`gs`.`deleted`));



INSERT INTO `journey`.`game_quest`
( `created`,`updated`,`title`,`system`,`goal`,`state`,`seconds_played`,`times_played`)
VALUES
("2018-01-18 20:00:00", "2018-01-18 21:00:00", "Sexy Parodius","PSX","Beat the game","completed",3632,1);

INSERT INTO `journey`.`game_submission`
(`quest_id`,`user_id`,`created`,`updated`,`deleted`,`comments`,`state`,`seconds_played`,`start_date`,`end_date`)
VALUES
(LAST_INSERT_ID(), 39453711,"2018-01-18 20:00:00","2018-01-18 21:00:00","2018-01-18 21:00:00","","completed",3632,"2018-01-18","2018-01-18");



INSERT INTO `journey`.`game_quest`
( `created`,`updated`,`title`,`system`,`goal`,`state`,`seconds_played`,`times_played`)
VALUES
("2018-02-18 10:00:00", "2018-02-18 12:00:00", "The Beginner's Guide","PC","Beat the game","completed",5654,1);

INSERT INTO `journey`.`game_submission`
(`quest_id`,`user_id`,`created`,`updated`,`deleted`,`comments`,`state`,`seconds_played`,`start_date`,`end_date`)
VALUES
(LAST_INSERT_ID(), 107568591,"2018-02-18 10:00:00", "2018-02-18 12:00:00","2018-02-18 12:00:00","","completed",5654,"2018-02-18","2018-02-18");

