var fs = require('fs');

var DEFAULT_CONFIG_FILE = __dirname + '/../config.json';
var CONFIG_FILE = DEFAULT_CONFIG_FILE;
var readAttempted = false;

/**
 * This method sets the path/name of the config file if something other than the
 * default is desired (e.g., in the case of unit tests which want to write their
 * own config file and point the code at that).
 */
exports.setConfigFilePath = function(configFilePath) {
	CONFIG_FILE = configFilePath;
	readAttempted = false;
};

/**
 * Reset config file path to the default.
 */
exports.resetConfigFilePath = function() {
	exports.setConfigFilePath(DEFAULT_CONFIG_FILE);
};

/**
 * Read and parse the config file, setting its contents into the exports.state variable.
 * The method returns exports.state, but the config information can also be accessed
 * thereafter by directly referencing exports.state.
 */
exports.getState = function() {
	if (!readAttempted) {
		readAttempted = true;
		try {
			var configBlob = fs.readFileSync(CONFIG_FILE, 'utf8');
		} catch (e) {
			consoler.error("Error occurred while attempting to read config file %s: %s", CONFIG_FILE, e);
		}
	
		if (configBlob !== undefined) {
			var state = JSON.parse(configBlob);
			exports.state = state;
		} else {
			exports.state = undefined;
		}
	}

	return exports.state;
};
