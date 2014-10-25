var logger = require('./utils/logging.js');

var fs = require('fs');
var path = require('path');

module.exports = function(store) {

	if (store.charAt(store.length-1) !== path.sep) {
		store += path.sep;
	}

	return new function() {

		this.recordingExists = function(recording) {

			var recording_path = store + recording.name;
			if (!recording.is_movie) recording_path += path.sep + recording.episode_name;
			recording_path += '.TiVo';

			logger.info("Looking for recording %s", recording_path);
			return fs.existsSync(path);
		};

		this.downloadRecording = function(recording, cb) {

		};
	}();

};
