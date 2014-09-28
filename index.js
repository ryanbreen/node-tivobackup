var util = require('util');

var config = require('./lib/utils/config.js').getState();
var logger = require('./lib/utils/logging.js').init(config);

var tivo_broker = require('./lib/tivo_broker.js');

logger.debug("Processing %d tivos", config.tivos.length);

config.tivos.forEach(function(tivo) {
	tivo_broker.findShows(tivo, function(err, shows) {
		if (err) return logger.error('Got error %s', err);
		logger.info("Found %d shows to save", shows.length);
	});
});
