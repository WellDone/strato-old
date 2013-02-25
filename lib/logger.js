var winston = require( 'winston' );

module.exports = function( logFile, debug ) {
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