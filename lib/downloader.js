var logger = require('./utils/logging.js');

var fs = require('fs');
var progress_class = require('progress');
var request = require('request');

var util = require('util');

var in_flight_downloads = {};
var pending_downloads = {};

var create_downloader = function(tivo, recording, cb) {
	return function() {
		in_flight_downloads[tivo.ip] = this;

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

		logger.debug("Downloading %s to %s", req.url, recording.recording_path);

		var bar;
		request(req).
		on('response', function(res) {
			recording.size = res.headers['tivo-estimated-length'];

			logger.trace('Starting download of %s of size %s', recording.title, recording.size);

			// TODO: Support a progress bar per recording.
			bar = new progress_class(recording.title + ' [:bar] :percent :etas', {
				complete: '=',
				incomplete: ' ',
				width: 100,
				total: parseInt(recording.size)
			});

		}).
		on('data', function(chunk) {
			bar.tick(chunk.length);
		}).
		// Send input to the correct path.
		pipe(fs.createWriteStream(recording.recording_path)).
		on('end', function(err) {
			if (err) return cb(err);

			console.log();

			delete in_flight_downloads[tivo.ip];

			if (pending_downloads[tivo.ip] && pending_downloads[tivo.ip].length > 0) {
				// Run the first pending download for this tivo
				pending_downloads[tivo.ip].shift()();
			}

			// Fire the callback to signify that the download of `recording.url` is complete.
			cb();
		});
	};
}

exports.downloadFile = function(tivo, recording, cb) {

	var download_fn = create_downloader(tivo, recording, cb);

	if (!in_flight_downloads[tivo.ip]) {
		logger.trace('Downloading recording %s immediately', recording.title);
		download_fn();
	} else {
		if (!pending_downloads[tivo.ip]) pending_downloads[tivo.ip] = [];
		logger.trace('Queueing download of %s', recording.title);
		pending_downloads[tivo.ip].push(download_fn);
	}


};
