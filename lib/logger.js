var winston = require( 'winston' ),
    fs = require( 'fs' ),
    config = require( './config.js' );

var theLogController = console;
var logController = function( logDir ) {
  if (!logDir ) logDir = config.logDir;
  if ( !fs.existsSync( logDir ) ) {
    fs.mkdirSync( logDir );
  }
  this.logDir = logDir;
  this.logFile = logDir + "/debug.log";
  this.logger = new (winston.Logger)({
    transports: [
      new winston.transports.File({ filename: this.logFile })
    ]
  });
  this.logger.add(winston.transports.Console);

  if ( config.DEBUG ) {
    this.logger.log( "debug", "DEBUG MODE!");
  }
}
logController.prototype = {
  serve: function( app, path ) {
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
  },

  //Aliases
  log: function( level, message, data ) { this.logger.log( level, message, data ); },
  info: function( message, data ) { this.logger.log( "info", message, data ); },
  warn: function( message, data ) { this.logger.log( "warn", message, data ); },
  error: function( message, data ) { this.logger.log( "error", message, data ); },
  debug: function( message, data ) { this.logger.log( "debug", message, data ); },

  profile: function( name ) { this.logger.profile( name ); }
}

module.exports = {
  start : function( logDir ) {
    theLogController = new logController( logDir );
    return theLogController;
  },
  get : function() {
    return theLogController;
  }
};