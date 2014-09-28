var cheerio = require('cheerio');
var request = require('request');

var logger = require('./utils/logging.js');

exports.findShows = function(tivo, cb) {
	if (!tivo.ip || !tivo.mak) return cb('Invalid tivo specification');

	logger.trace("Requesting show list from %s", tivo.ip);

	var req = {
		// Load the document in recurse mode so we get a listing for all shows.
		'url': 'https://' + tivo.ip + '/nowplaying/index.html?Recurse=Yes',
		'auth': {
			'user': 'tivo',
			'pass': tivo.mak,
			'sendImmediately': false
		},
		'strictSSL': false
	};

	request(req, function(err, response, html) {

		if (err) return cb(err);

		var $ = cheerio.load(html);

		// This img is used by TiVo's web interface to indicate that the show should never
		// be deleted.  This is our indicator that the show should be backed up.
		var imgs = $('img[src*="save-until-i-delete-recording"]');

		// Find the entire TR for each case of save-util-i-delete
		var shows_to_save = imgs.parentsUntil('tr');

		return cb(null, shows_to_save);
	});
};
