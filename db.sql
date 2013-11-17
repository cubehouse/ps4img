--
-- Table structure for table `images`
--

CREATE TABLE IF NOT EXISTS `images` (
  `id` bigint(11) NOT NULL AUTO_INCREMENT,
  `twit_id` varchar(24) NOT NULL,
  `tweet_id` varchar(24) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `url` varchar(512) NOT NULL,
  `hash` varchar(32) NOT NULL,
  `salt` varchar(15) NOT NULL,
  `ext` varchar(4) NOT NULL,
  `nice_url` varchar(128) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `twit_id` (`twit_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=79 ;