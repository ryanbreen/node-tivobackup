var logger = require('./utils/logging.js');

var fs = require('fs');
var path = require('path');

module.exports = function(store) {

	if (store.charAt(store.length-1) !== path.sep) {
		store += path.sep;
	}

	return new function() {

		this.recordingExists = function(recording) {

			var title = recording.seriesTitle || recording.title;
			var episodeTitle = recording.episodeTitle || recording.seriesTitle;

			var recording_path = store + title + path.sep + episodeTitle;

			logger.info("Looking for recording %s", recording_path);
			return fs.existsSync(path);
		};

		this.storeRecording = function(recording) {

		};

		var writeMetadata = function(metadata) {
		};

		var downloadRecording = function(recording, cb) {

		};
	}();

};
