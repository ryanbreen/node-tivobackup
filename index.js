var util = require('util');

var config = require('./lib/utils/config.js').getState();
var logger = require('./lib/utils/logging.js').init(config);

var tivo_broker = require('./lib/tivo_broker.js');

var file_manager = require('./lib/file_manager.js')(config.store);

logger.debug("Processing %d tivos", config.tivos.length);

config.tivos.forEach(function(tivo) {
	tivo_broker.findRecordings(tivo, function(err, recordings) {
		if (err) return logger.error('Got error %s', err);

		// Some TiVos really don't like the download call to immediately follow all of the queries we make in findRecordings.
		setTimeout(function() {
			logger.info("There are %d recordings to save", recordings.length)
			recordings.forEach(function(recording) {
				logger.trace(util.inspect(recording));

				if (!file_manager.recordingExists(recording)) {
					logger.info("Need to store recording %s", recording.title);
					file_manager.storeRecording(tivo, recording, function(err) {
						if (err) return logger.error('Failed to save recording %s due to %s', recording.title, err);
					});
				}
			});
		}, 500);
	});
});
