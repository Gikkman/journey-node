CREATE TABLE `chat_customcommands` (
  `command` varchar(15) NOT NULL,
  `response` text NOT NULL,
  PRIMARY KEY (`command`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `config` (
  `key` varchar(45) NOT NULL,
  `value` varchar(45) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `faq_category` (
  `category` varchar(20) NOT NULL,
  `weight` int(10) unsigned NOT NULL,
  PRIMARY KEY (`weight`),
  UNIQUE KEY `UQ_Topic` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `faq_commands_category` (
  `category` varchar(20) NOT NULL,
  `display_name_override` varchar(20) DEFAULT NULL,
  `weight` int(10) unsigned NOT NULL,
  `description` text,
  PRIMARY KEY (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `faq_commands_content` (
  `category` varchar(20) NOT NULL,
  `weight` int(10) unsigned NOT NULL,
  `command` varchar(20) NOT NULL,
  `flag` varchar(10) NOT NULL DEFAULT '',
  `parameters` varchar(100) NOT NULL DEFAULT '',
  `example` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `cooldown` int(10) unsigned NOT NULL DEFAULT '0',
  `cooldown_mode_global` tinyint(3) unsigned NOT NULL DEFAULT '1',
  `cost` int(10) unsigned NOT NULL DEFAULT '0',
  `editor_plus` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `mod_plus` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `owner_only` tinyint(3) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`category`,`weight`),
  KEY `fk_cmd_category_idx` (`category`),
  CONSTRAINT `fk_cmd_category` FOREIGN KEY (`category`) REFERENCES `faq_commands_category` (`category`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `faq_content` (
  `category` varchar(20) NOT NULL,
  `weight` int(10) unsigned NOT NULL,
  `question` varchar(50) NOT NULL,
  `answer` text NOT NULL,
  PRIMARY KEY (`category`,`weight`),
  CONSTRAINT `fk_faq_category` FOREIGN KEY (`category`) REFERENCES `faq_category` (`category`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `game_active` (
  `uid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `submission_id` int(10) unsigned NOT NULL,
  `system` varchar(20) NOT NULL,
  `state` varchar(20) NOT NULL,
  PRIMARY KEY (`uid`),
  UNIQUE KEY `game_active_unique` (`system`,`state`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8;

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
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

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
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `submissiontokens` (
  `created` datetime NOT NULL,
  `user_id` int(16) unsigned NOT NULL,
  `token` varchar(36) NOT NULL,
  PRIMARY KEY (`user_id`),
  KEY `userid` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `user_statuses` (
  `user_id` int(10) unsigned NOT NULL,
  `editor` int(1) unsigned NOT NULL DEFAULT '0',
  `known` int(1) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_status_uid` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `user_variables` (
  `user_id` int(10) unsigned NOT NULL,
  `gold_current` decimal(10,2) NOT NULL DEFAULT '0.00',
  `gold_lifetime` decimal(10,2) NOT NULL DEFAULT '0.00',
  `losing_streak` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_var_uid` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `users` (
  `user_id` int(16) unsigned NOT NULL,
  `created` datetime NOT NULL,
  `last_seen` datetime NOT NULL,
  `user_name` varchar(25) NOT NULL,
  `display_name` varchar(25) NOT NULL,
  `type` varchar(10) NOT NULL DEFAULT 'default',
  `verified` int(1) unsigned NOT NULL DEFAULT '0',
  `access_token` varchar(100) NOT NULL DEFAULT '',
  `refresh_token` varchar(100) NOT NULL DEFAULT '',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `id_UNIQUE` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;