var util = require('util');

var config = require('./lib/utils/config.js').getState();
var logger = require('./lib/utils/logging.js').init(config);

var tivo_broker = require('./lib/tivo_broker.js');

logger.debug("Processing %d tivos", config.tivos.length);

config.tivos.forEach(function(tivo) {
	tivo_broker.findRecordings(tivo, function(err, recordings) {
		if (err) return logger.error('Got error %s', err);

		logger.info("There are %d recordings to save", recordings.length)
		recordings.forEach(function(recording) {
			if (recording.is_movie) {
				logger.trace('Movie URL %s, title "%s"', recording.url, recording.name);
			} else {
				logger.trace('Show URL %s, %s episode "%s"', recording.url, recording.name, recording.episode_name);
			}
		});
	});
});
