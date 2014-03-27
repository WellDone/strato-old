var winston = require( 'winston' ),
    config = require( './config.js' );

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({'timestamp':true})
  ]
});

if ( config.DEBUG ) {
  logger.log( "debug", "DEBUG MODE!");
}

logger.serve = function( app, path ) {
  var logger = this.logger;
  var logFile = this.logFile;
  app.get( path + "/log.json", function( req, res ) {
    res.sendfile( logFile );
  });
  //TODO: Use socket.io se we can stream to a browser.
  /*
  app.get( path + "/log.stream", function( req, res ) {
    logger.log( "info", "requested log!!");
    if ( !req.query.start && req.query.start !== 0 ) { req.query.start = -1; }
    res.writeHead(206, {
      'Content-Type': 'text/plain'
    });
    res.write( "<h1>Streaming the log...</h1><br/>", "utf8" );
    logger.log( "info", "streaming...");
    logger.stream({ start: req.query.start }).on( 'log', function(log) {
      res.write( log + "<br/>", "utf8" );
    })
    logger.debug( "debug stream connected");
  });
*/
}

logger.start = function() {
  return logger;
}

module.exports = logger;