var _ = require('underscore');
var request = require('request');

var parseString = require('xml2js').parseString;

var util = require('util');

var logger = require('./utils/logging.js');

exports.processRequest = function(req, recording_metadata, metadata, cb) {

	if (!cb) cb = metadata;

	request(req, function(err, response, xml) {

		if (err) return cb(err);

		parseString(xml, {trim: true, explicitArray: false}, function (err, result) {

			if (result && result['TvBusMarshalledStruct:TvBusEnvelope']) {

				var detail = result['TvBusMarshalledStruct:TvBusEnvelope'];

				console.log(util.inspect(result, {'depth':10}));
				metadata.time = detail.showing.time;
				metadata.originalAirDate = detail.showing.program.originalAirDate;
				metadata.movieYear = detail.showing.program.movieYear;
				metadata.seriesTitle = detail.showing.program.series ? detail.showing.program.series.seriesTitle : undefined;
				metadata.title = detail.showing.program.title;
				metadata.episodeTitle = detail.showing.program.episodeTitle;
				metadata.description = detail.showing.program.description;
				metadata.isEpisode = detail.showing.program.isEpisode === 'true';
				metadata.is_movie = detail.showing.program.showType._ === 'MOVIE';
			}

			else if (result || result.TiVoContainer || result.TiVoContainer.Item) {

				result.TiVoContainer.Item.forEach(function(item) {

					// If there are subitems, traverse into this folder and add it to the collection
					if (item.Details && item.Details.TotalItems && item.Links && item.Links.Content && item.Links.Content.Url) {
						var new_req = _.clone(req);
						new_req.url = item.Links.Content.Url;
						recording_metadata.pending_count += 1;
						exports.processRequest(new_req, recording_metadata, cb);
					} else {
						if (item.Details && item.Links && item.Links.Content && item.Links.Content.Url &&
							// Only save those recordings flagged save-until-i-delete
							item.Links.CustomIcon && item.Links.CustomIcon.Url === 'urn:tivo:image:save-until-i-delete-recording') {

							var metadata = {
								url: item.Links.Content.Url,
								seriesId: item.Details.SeriesId,
								episodeNumber: item.Details.EpisodeNumber,
								displayMajorNumber: item.Details.SourceChannel,
								callSign: item.Details.SourceStation
							};

							recording_metadata.recordings_to_save.push(metadata);

							var new_req = _.clone(req);
							new_req.url = item.Links.TiVoVideoDetails.Url;
							recording_metadata.pending_count += 1;
							exports.processRequest(new_req, recording_metadata, metadata, cb);

						}
					}
				});
			} else {
				return cb('Invalid XML response');
			}

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
		// Load the root Now Playing folder.
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

	// Process the Now Playing folder and any subfolders.
	exports.processRequest(req, recording_metadata, cb);
};
