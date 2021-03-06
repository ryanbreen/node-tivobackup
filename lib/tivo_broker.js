var _ = require('underscore');
var request = require('request');

var parseString = require('xml2js').parseString;

var util = require('util');

var logger = require('./utils/logging.js');

var STAR_RATINGS = {
	'ONE': '1',
	'THREE_POINT_FIVE': '1.5',
	'TWO': '2',
	'TWO_POINT_FIVE': '2.5',
	'THREE': '3',
	'THREE_POINT_FIVE': '3.5',
	'FOUR': '4'
};

var gather_array = function(input) {

	// If only a single value is present, wrap in an array.
	if (typeof input === 'string') return [input];

	var rvalue = [];
	if (!input) return rvalue;

	for (var i=0; i<input.length; ++i) {
		if (input[i].length > 0) rvalue.push(input[i]);
	}
	return rvalue;
};

function create_cb_wrapper(recordings, cb) {
	return function(err) {
		if (err) return cb(err);

		recordings.pending_count -= 1;
		if (recordings.pending_count <= 0) {
			cb(null, recordings.recordings_to_save);
		}
	};
};

exports.processShowDetailRequest = function(req, metadata, cb) {

	request(req, function(err, response, xml) {

		if (err) return cb(err);

		parseString(xml, {trim: true, mergeAttrs: true, explicitArray: false}, function (err, result) {

			if (result && result['TvBusMarshalledStruct:TvBusEnvelope']) {

				var detail = result['TvBusMarshalledStruct:TvBusEnvelope'];

				delete detail.vActualShowing;
				delete detail.$;

				//console.log(util.inspect(result, {'depth':10}));
				metadata.time = detail.showing.time;
				metadata.originalAirDate = detail.showing.program.originalAirDate;
				metadata.movieYear = detail.showing.program.movieYear;
				metadata.seriesTitle = detail.showing.program.series ? detail.showing.program.series.seriesTitle : undefined;
				metadata.title = detail.showing.program.title;
				metadata.episodeTitle = detail.showing.program.episodeTitle;
				metadata.description = detail.showing.program.description;
				metadata.isEpisode = detail.showing.program.isEpisode === 'true';
				metadata.showingBits = detail.showing.showingBits.value;
				if (detail.showing.tvRating) metadata.tvRating = detail.showing.tvRating._;
				if (detail.showing.program.starRating) metadata.starRating = STAR_RATINGS[detail.showing.program.starRating._];
				if (detail.showing.program.mpaaRating) metadata.mpaaRating = detail.showing.program.mpaaRating._.replace('_', '-');
				if (detail.showing.program.colorCode) metadata.colorCode = 'x' + detail.showing.program.colorCode.value;
				if (detail.showing.program.partCount) metadata.partCount = detail.showing.program.partCount;
				if (detail.showing.program.partIndex) metadata.partIndex = detail.showing.program.partIndex;

				// Doesn't look like TiVo exposes vSeriesGenre or vProgramGenre anymore, so we ignore those.

				['vActor', 'vGuestStar', 'vDirector', 'vExecProducer', 'vProducer', 'vWriter', 'vHost', 'vChoreographer'].forEach(function(varname) {
					metadata[varname] = gather_array(detail.showing.program[varname].element);
				});

				metadata.is_movie = detail.showing.program.showType._ === 'MOVIE';
				cb();
			}
		});
	});

};

exports.processListingRequest = function(tivo, req, recordings, cb) {

	cb = create_cb_wrapper(recordings, cb);

	request(req, function(err, response, xml) {

		if (err) return cb(err);

		//console.log(util.inspect(response.headers));
		if (!tivo.sid) {
			tivo.sid = response.headers['set-cookie'][0].split(';')[0];
			logger.info('TiVo session id is %s', tivo.sid);
		}

		if (!req.headers) req.headers = {};
		req.headers['cookie'] = 'sid=' + tivo.sid;
		//console.log(util.inspect(req.headers));)

		logger.info("Requesting %s", req.url);

		parseString(xml, {trim: true, mergeAttrs: true, explicitArray: false}, function (err, result) {

			//console.log("Listing request:\n%s", util.inspect(result, {'depth':10}));

			if (result || result.TiVoContainer || result.TiVoContainer.Item) {

				var max_index = parseInt(result.TiVoContainer.ItemCount) + parseInt(result.TiVoContainer.ItemStart);

				logger.info('max_index is %s', max_index);

				// If this container is not the complete listing, request more.
				if (result.TiVoContainer.Details && result.TiVoContainer.ItemCount &&
					result.TiVoContainer.Details.TotalItems != result.TiVoContainer.ItemCount &&
					result.TiVoContainer.Details.TotalItems > max_index) {

					var new_req = _.clone(req);
					new_req.url = 'https://' + tivo.ip + '/TiVoConnect?Command=QueryContainer&Details=All&Container=%2FNowPlaying&AnchorOffset=' + max_index;
					recordings.pending_count += 1;
					exports.processListingRequest(tivo, new_req, recordings, cb);
				}

				// If there's only a single match, wrap it in an array.
				if (!util.isArray(result.TiVoContainer.Item)) {
					result.TiVoContainer.Item = [ result.TiVoContainer.Item ];
				}

				result.TiVoContainer.Item.forEach(function(item) {

					// If there are subitems, traverse into this folder and add it to the collection
					if (item && item.Details && item.Details.TotalItems && item.Links && item.Links.Content && item.Links.Content.Url) {
						var new_req = _.clone(req);
						new_req.url = item.Links.Content.Url;
						recordings.pending_count += 1;
						exports.processListingRequest(tivo, new_req, recordings, cb);
					} else if (item && item.Details && item.Links && item.Links.Content && item.Links.Content.Url &&
						// Only save those recordings flagged save-until-i-delete
						item.Links.CustomIcon && item.Links.CustomIcon.Url === 'urn:tivo:image:save-until-i-delete-recording') {

						// If this is a copy-protected show, we won't be able to download it.
						if (item.Details.CopyProtected === 'Yes') return;

						//console.log(util.inspect(item, {'depth':10}));

						var metadata = {
							url: item.Links.Content.Url + '&Format=video/x-tivo-mpeg-ts',
							seriesId: item.Details.SeriesId,
							episodeNumber: item.Details.EpisodeNumber,
							displayMajorNumber: item.Details.SourceChannel,
							callSign: item.Details.SourceStation
						};

						recordings.recordings_to_save.push(metadata);

						// Requests only differ by the URL used
						var new_req = _.clone(req);
						new_req.url = item.Links.TiVoVideoDetails.Url;
						recordings.pending_count += 1;
						exports.processShowDetailRequest(new_req, metadata, cb);
					}
				});
			} else {
				// Should we check recordings.pending_count here?  My money is on no because that just enables
				// aberrant conditions by coddling them.
				return cb('Invalid XML response');
			}

			cb();
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

	var recordings = {
		pending_count: 1,
		recordings_to_save: []
	}

	// Process the Now Playing folder and any subfolders.
	exports.processListingRequest(tivo, req, recordings, cb);
};
