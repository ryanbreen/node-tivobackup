var logger = require('./utils/logging.js');

var fs = require('fs');
var path = require('path');

var mkdirp = require('mkdirp');

module.exports = function(store) {

	if (store.charAt(store.length-1) !== path.sep) {
		store += path.sep;
	}

	return new function() {

		var create_recording_path = function(recording) {
			var title = recording.seriesTitle || recording.title;
			var episodeTitle = recording.episodeTitle || recording.seriesTitle;

			return store + title + path.sep + episodeTitle;
		};

		this.recordingExists = function(recording) {
			var recording_path = create_recording_path(recording);
			logger.info("Looking for recording %s", recording_path);
			return fs.existsSync(path);
		};

		this.storeRecording = function(recording, cb) {
			writeMetadata(recording, function(err) {
				if (err) return cb(err);

				downloadRecording(recording, cb);
			});
		};

		var writeMetadata = function(recording, cb) {
			// TODO: Emit the recording metadata in pytivo format.
			cb();
		};

		var downloadRecording = function(recording, cb) {
			// no-op for now.
			cb();
		};
	}();

};
