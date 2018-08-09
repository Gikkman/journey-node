/**
 * Author:  Gikkman
 * Created: Jul 25, 2018
 */
ALTER TABLE `journey`.`game_active` 
ADD COLUMN `index` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `state`,
ADD COLUMN `subindex` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `index`;

UPDATE journey.game_active SET `index` = (SELECT MAX(`index`) FROM gamesplayed) + 1 WHERE `system` = 'journey' AND `state` = 'current';
UPDATE journey.game_active SET `index` = (SELECT MAX(`index`) FROM gamesplayed) + 2 WHERE `system` = 'journey' AND `state` = 'next';



ALTER TABLE `journey`.`gamesplayed` 
ADD COLUMN `subindex` INT(10) UNSIGNED NOT NULL DEFAULT 0 AFTER `sub_index`;

UPDATE gamesplayed SET subindex = 1 WHERE sub_index = "B" AND `uid` > 1;

ALTER TABLE `journey`.`gamesplayed` 
DROP COLUMN `sub_index`;
