var request = require('request');

var parseString = require('xml2js').parseString;

var util = require('util');

var logger = require('./utils/logging.js');

exports.findRecordings = function(tivo, cb) {
	if (!tivo.ip || !tivo.mak) return cb('Invalid tivo specification');

	logger.trace("Requesting show list from %s", tivo.ip);

	var req = {
		// Load the document in recurse mode so we get a listing for all shows.
		//'url': 'https://' + tivo.ip + '/nowplaying/index.html?Recurse=Yes',
		'url': 'https://' + tivo.ip + '/TiVoConnect?Command=QueryContainer&Container=%2FNowPlaying',
		'auth': {
			'user': 'tivo',
			'pass': tivo.mak,
			'sendImmediately': false
		},
		'strictSSL': false
	};

	request(req, function(err, response, xml) {

		if (err) return cb(err);

		parseString(xml, function (err, result) {

			var recordings_to_save = [];

			if (!result || !result.TiVoContainer || !result.TiVoContainer.Item) return cb('Invalid XML response');

			result.TiVoContainer.Item.forEach(function(item) {

				console.log(util.inspect(item, {'depth':10}));

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
	});
};
