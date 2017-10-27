ALTER TABLE `journey`.`users`
ADD COLUMN `access_token` VARCHAR(100) NOT NULL AFTER `verified`,
ADD COLUMN `refresh_token` VARCHAR(100) NOT NULL AFTER `access_token`;

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `game_quest` (
  `uid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `created` datetime NOT NULL,
  `updated` datetime NOT NULL,
  `title` varchar(100) NOT NULL,
  `system` varchar(50) NOT NULL,
  `goal` varchar(100) NOT NULL,
  `state` varchar(20) NOT NULL,
  `seconds_played` int(10) unsigned NOT NULL DEFAULT '0',
  `times_played` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `game_submission` (
  `uid` int(11) NOT NULL AUTO_INCREMENT,
  `quest_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `created` datetime NOT NULL,
  `updated` datetime NOT NULL,
  `deleted` datetime DEFAULT NULL,
  `comments` text NOT NULL,
  `state` varchar(20) NOT NULL,
  `seconds_played` int(10) unsigned NOT NULL DEFAULT '0',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`uid`),
  KEY `fk_gs_quest_id_idx` (`quest_id`),
  KEY `fk_gs_user_id_idx` (`user_id`),
  CONSTRAINT `fk_gs_quest_id` FOREIGN KEY (`quest_id`) REFERENCES `game_quest` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_gs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;

CREATE TABLE `game_active` (
  `uid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `submission_id` int(10) unsigned NOT NULL,
  `system` varchar(20) NOT NULL,
  `state` varchar(20) NOT NULL,
  PRIMARY KEY (`uid`),
  UNIQUE KEY `game_active_unique` (`system`,`state`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;