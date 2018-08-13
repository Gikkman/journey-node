/**
 * Author:  Gikkman
 * Created: Jul 25, 2018
 */
ALTER TABLE `journey`.`game_submission`
ADD COLUMN `dn_override` VARCHAR(45) NULL AFTER `end_date`;



ALTER TABLE `journey`.`game_active` 
ADD COLUMN `index` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `state`,
ADD COLUMN `subindex` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `index`;

ALTER TABLE `journey`.`game_active` 
DROP INDEX `game_active_unique` ;

UPDATE journey.game_active SET `index` = (SELECT MAX(`index`) FROM gamesplayed) + 1 WHERE `system` = 'journey' AND `state` = 'current';
UPDATE journey.game_active SET `index` = (SELECT MAX(`index`) FROM gamesplayed) + 2 WHERE `system` = 'journey' AND `state` = 'next';



ALTER TABLE `journey`.`gamesplayed` 
ADD COLUMN `subindex` INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `sub_index`;
ADD COLUMN `vote_timer` INT(10) UNSIGNED NULL AFTER `subindex`;

UPDATE gamesplayed SET subindex = 1 WHERE sub_index = "B" AND `uid` > 1;

ALTER TABLE `journey`.`gamesplayed` 
DROP COLUMN `sub_index`;



INSERT INTO `journey`.`config` (`key`, `value`) VALUES ('vote_time_init', '5400');
