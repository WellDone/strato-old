var winston = require( 'winston' ),
    fs = require( 'fs' );

module.exports = function( logDir, debug ) {
  if ( !fs.exists( logDir ) ) {
    fs.mkdir( logDir );
  }
  var logFile = logDir + "/debug.log";
  var logger = new (winston.Logger)({
    transports: [
      new winston.transports.File({ filename: logFile })
    ]
  });
  if ( debug ) {
    logger.add(winston.transports.Console);
    logger.log( "debug", "DEBUG MODE!");
  }
  return logger;
}