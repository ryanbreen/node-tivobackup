var logger = require('./utils/logging.js');

var fs = require('fs');
var progress_class = require('progress');
var request = require('request');

var util = require('util');

var in_flight_downloads = {};
var pending_downloads = {};

var bar;

var create_progress_bar = function(total) {
	if (bar) {
		var cur = bar.curr;
		var start = bar.start;
		logger.trace("Bar is currently at %s of %s", cur, total);
	} else {
		var cur = 0;
		var start = 0;
		logger.debug("Starting new progress bar");
	}

	bar = new progress_class('show(s) [:bar] :percent :etas', {
		complete: '=',
		incomplete: ' ',
		width: 100,
		total: total
	});

	bar.curr = cur;
	bar.start = start;
};

var add_to_progress_bar = function(recording) {
	var tot = bar ? bar.total : 0;
	tot += recording.size;
	create_progress_bar(tot);
};

var remove_from_progress_bar = function(recording) {
	var tot = bar ? bar.total : 0;
	tot -= recording.size;
	create_progress_bar(tot);
};

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

		request(req).
		on('response', function(res) {
			recording.size = parseInt(res.headers['tivo-estimated-length']);

			logger.trace('Starting download of %s of size %s', recording.title, recording.size);

			add_to_progress_bar(recording);
		}).
		on('data', function(chunk) {
			bar.tick(chunk.length);
		}).
		// Send input to the correct path.
		pipe(fs.createWriteStream(recording.recording_path)).
		on('end', function(err) {
			if (err) return cb(err);

			remove_from_progress_bar(recording);

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
