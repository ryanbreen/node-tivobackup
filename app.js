var util = require('util');

var config = require('./utils/config.js');
var logger = require('./utils/logger.js').getLogger('app');

logger.debug("Loaded config:\n%s", util.inspect(config.getState()));