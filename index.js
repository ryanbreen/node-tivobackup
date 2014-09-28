var util = require('util');

var config = require('./utils/config.js').getState();
var logger = require('./utils/logging.js').init(config);

logger.debug("Loaded config:\n%s", util.inspect(config));