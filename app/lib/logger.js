var winston = require( 'winston' ),
    config = require( './config.js' );

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      timestamp: true,
      handleExceptions: true,
      exitOnError: true
    })
  ]
});

if ( config.DEBUG ) {
  logger.log( "debug", "DEBUG MODE!");
}

logger.serve = function( app, path ) {
  var logger = this.logger;
  app.get( path + "/api/out.log", function( req, res ) {
    res.sendfile( '/home/application/api/out.log' );
  });
  app.get( path + "/api/err.log", function( req, res ) {
    res.sendfile( '/home/application/api/err.log' );
  });
  app.get( path + "/gateway/out.log", function( req, res ) {
    res.sendfile( '/home/application/gateway/out.log' );
  });
  app.get( path + "/gateway/err.log", function( req, res ) {
    res.sendfile( '/home/application/gateway/err.log' );
  });
}

logger.start = function() {
  return logger;
}

module.exports = logger;