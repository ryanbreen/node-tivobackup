var _ = require('underscore');
var request = require('request');

var parseString = require('xml2js').parseString;

var util = require('util');

var logger = require('./utils/logging.js');

exports.processRequest = function(req, recording_metadata, cb) {
	request(req, function(err, response, xml) {

		if (err) return cb(err);

		parseString(xml, {trim: true, explicitArray: false}, function (err, result) {

			if (!result || !result.TiVoContainer || !result.TiVoContainer.Item) return cb('Invalid XML response');

			result.TiVoContainer.Item.forEach(function(item) {

				console.log(util.inspect(item, {'depth':10}));

				// If there are subitems, traverse into this folder and add it to the collection
				if (item.Details && item.Details.TotalItems && item.Links && item.Links.Content && item.Links.Content.Url) {
					var new_req = _.clone(req);
					new_req.url = item.Links.Content.Url;
					recording_metadata.pending_count += 1;
					exports.processRequest(new_req, recording_metadata, cb);
				} else {
					if (item.Details && item.Links && item.Links.Content && item.Links.Content.Url) {
						recording_metadata.recordings_to_save.push({
							url: item.Links.Content.Url,
							name: item.Details.Title,
							episode_name: item.Details.EpisodeTitle ? item.Details.EpisodeTitle : undefined
						});
					}
				}
/**
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
**/
			});

			recording_metadata.pending_count -= 1;
			if (recording_metadata.pending_count === 0) {
				cb(null, recording_metadata.recordings_to_save);
			}
		});
	});
};

exports.findRecordings = function(tivo, cb) {
	if (!tivo.ip || !tivo.mak) return cb('Invalid tivo specification');

	logger.trace("Requesting show list from %s", tivo.ip);

	var req = {
		// Load the document in recurse mode so we get a listing for all shows.
		//'url': 'https://' + tivo.ip + '/nowplaying/index.html?Recurse=Yes',
		//'url': 'https://' + tivo.ip + '/TiVoConnect?Command=QueryContainer&Details=All&Container=%2FNowPlaying%2F17%2F317847673',
		'url': 'https://' + tivo.ip + '/TiVoConnect?Command=QueryContainer&Details=All&Container=%2FNowPlaying',
		'auth': {
			'user': 'tivo',
			'pass': tivo.mak,
			'sendImmediately': false
		},
		'strictSSL': false
	};

	var recording_metadata = {
		pending_count: 1,
		recordings_to_save: []
	}

	exports.processRequest(req, recording_metadata, cb);
};
