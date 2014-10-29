var logger = require('./utils/logging.js');

var fs = require('fs');
var path = require('path');

var mkdirp = require('mkdirp');

module.exports = function(store) {

	if (store.charAt(store.length-1) !== path.sep) {
		store += path.sep;
	}

	var PYTIVO_METADATA = [
		'title','seriesTitle','episodeTitle','episodeNumber','isEpisode','movieYear','description','seriesId','originalAirDate','time', 'displayMajorNumber',
		'callsign','showingBits','tvRating','partCount','partIndex','vProgramGenre','vDirector','vActor','vSeriesGenre', 'vProducer'
	];

	return new function() {

		var create_recording_path = function(recording) {
			var title = recording.seriesTitle || recording.title;
			var episodeTitle = recording.episodeTitle || recording.seriesTitle;

			recording.parent_dir = store + title + path.sep;
			recording.metadata_path = recording.parent_dir + episodeTitle; + ".txt";
			recording.recording_path = recording.parent_dir + episodeTitle + ".TiVo";
		};

		this.recordingExists = function(recording) {
			create_recording_path(recording);
			logger.info("Looking for recording %s", recording.recording_path);
			return fs.existsSync(recording.path);
		};

		this.storeRecording = function(recording, cb) {
			create_recording_path(recording);

			mkdirp(recording.parent_dir, function(err) {
				if (err) return cb(err);
				writeMetadata(recording, function(err) {
					if (err) return cb(err);

					downloadRecording(recording, cb);
				});	
			})
		};

		var render_field = function(recording, field) {

		};

		var writeMetadata = function(recording, cb) {
			var pytivo_block = '';
			PYTIVO_METADATA.forEach(function(field) {
				if (recording[field]) pytivo_block += render_field(recording, field);
			});

			fs.writeFile(recording.metadata_path, pytivo_block, function(err) {
				if (err) return cb(err);

				cb();
			});
		};

		var downloadRecording = function(recording, cb) {
			// no-op for now.
			cb();
		};
	}();

};
