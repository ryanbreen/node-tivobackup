var logger = require('./utils/logging.js');

var fs = require('fs');
var path = require('path');

var mkdirp = require('mkdirp');
var request = require('request');

var util = require('util');

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
			recording.metadata_path = recording.parent_dir + episodeTitle + ".txt";
			recording.recording_path = recording.parent_dir + episodeTitle + ".TiVo";
		};

		this.recordingExists = function(recording) {
			create_recording_path(recording);
			logger.info("Looking for recording %s", recording.recording_path);
			return fs.existsSync(recording.path);
		};

		this.storeRecording = function(tivo, recording, cb) {
			create_recording_path(recording);

			mkdirp(recording.parent_dir, function(err) {
				if (err) return cb(err);
				writeMetadata(recording, function(err) {
					if (err) return cb(err);

					downloadRecording(tivo, recording, cb);
				});
			})
		};

		var render_line = function(field, val) {
			if (typeof val === 'string') val = val.trim();
			return field + ': ' + val + '\n';
		};

		var render_field = function(recording, field) {
			var rvalue = '';
			var val = recording[field];
			if (util.isArray(val)) {
				val.forEach(function(v) {
					rvalue += render_line(field, v);
				});
			} else {
				rvalue += render_line(field, val);
			}
			return rvalue;
		};

		var writeMetadata = function(recording, cb) {
			var pytivo_block = '';
			PYTIVO_METADATA.forEach(function(field) {
				if (recording[field]) pytivo_block += render_field(recording, field);
			});

			logger.trace('Writing metadata to %s', recording.metadata_path);
			fs.writeFile(recording.metadata_path, pytivo_block, function(err) {
				if (err) return cb(err);

				cb();
			});
		};

		var downloadRecording = function(tivo, recording, cb) {
			// Start the download.
			var req = {
				'url': recording.url,
				'auth': {
					'user': 'tivo',
					'pass': tivo.mak,
					'sendImmediately': false
				},
				'strictSSL': false,
				'headers': {
					'cookie': 'sid=' + tivo.sid
				}
			};

			logger.debug("Downloading %s", req.url);

			setTimeout(function() {
				request(req).pipe(fs.createWriteStream(recording.recording_path));
				cb();
			}, 5000);
		};
	}();

};
