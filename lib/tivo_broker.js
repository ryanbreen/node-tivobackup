var $ = require('cheerio');
var request = require('request');

var logger = require('./utils/logging.js');

var TV_SHOW_REGEX = /([^:]*): "([^"]*)"/

exports.findRecordings = function(tivo, cb) {
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

//	request(req, function(err, response, html) {
	var fs = require('fs');
	var util = require('util');
	fs.readFile('/Users/wrb/Downloads/jenn_tivo.html', {'encoding':'utf8'}, function(err, html) {

		if (err) return cb(err);

		// This img is used by TiVo's web interface to indicate that the show should never
		// be deleted.  This is our indicator that the show should be backed up.
		var imgs = $('img[src*="save-until-i-delete-recording"]', html);
		var recordings_to_save = [];

		imgs.each(function(i, img) {

			// Find the entire TR for each case of save-util-i-delete
			var row = $(img).parent().parent();
			var description = $(row).find('b').text();

			var matches = description.match(TV_SHOW_REGEX);
			if (matches) {
				var name = matches[1];
				var episode_name = matches[2];
			} else {
				var name = description;
			}

			// Now parse out the stuff we care about
			recordings_to_save.push({
				url: $(row).last().find('a').first().attr('href'),
				is_movie: matches === null,
				name: name,
				episode_name: episode_name
			});
		});

		return cb(null, recordings_to_save);
	});
};
