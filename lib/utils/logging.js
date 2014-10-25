var util = require('util');

var bunyan = require('bunyan');

// Create a default logger to use if all else fails.
module.exports = bunyan.createLogger({name: 'tivobackup'});

// Init the logger with a configuration object
module.exports.init = function(config) {

  // If no logger is defined in the config, there's nothing more to do.  We'll just continue using the
  // default logger.
  if (!config.logger) return module.exports;

  config.logger.streams.forEach(function(stream) {
    if (stream.stream === "process.stdout") stream.stream = process.stdout;
    else if (stream.stream === "process.stderr") stream.stream = process.stderr;
  });

  module.exports = bunyan.createLogger(config.logger);
  return module.exports;
};
