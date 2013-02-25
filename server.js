var express = require( 'express' ),
    app = express();

var config = {
  databaseURL: process.env.DATABASE_URL,
  DEBUG: process.env.NODE_DEBUG_MODE? true:false,
  port: process.env.PORT || 3000,
  logFile: process.env.WD_LOG_PATH || __dirname + "/debug/debug.log"
};

var logger = require( './lib/logger' )( config.logFile, config.DEBUG )
logger.info( "Configuration: ", config );

var dbEngine = require( './lib/db.js' )
  , db;

db = dbEngine.connect( { url: config.databaseURL, logger: logger } );

var resourceServer = new (require( './lib/resourceServer.js' ))( app )
  , templateServer = new (require( './lib/templateServer.js' ))( app )
  , dataServer = new (require( './lib/dataServer.js' ))( app, db );

resourceServer.serve( "/resources", __dirname + "/resources");

templateServer.serve( "/templates", __dirname + "/resources/html/templates" );

dataServer.serve( "/data" );

app.get( '/', function( req, res ) {
  res.sendfile( __dirname + "/resources/html/index.html" );
});

app.listen( config.port );

var startDate = new Date();
logger.log( "info", "Server started at " + startDate.toTimeString() + " on " + startDate.toDateString() + ".");

logger.log( "info", "Listening on port " + config.port + "." );