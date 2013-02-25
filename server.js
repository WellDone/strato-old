var config = require('./lib/config');

var express = require( 'express' ),
    app = express();

var logger = new (require( './lib/logger' ))( )
logger.info( "Configuration: ", config );

var dbEngine = require( './lib/db.js' )
  , db;

db = dbEngine.connect( { url: config.databaseURL, logger: logger } );

var resourceServer = new (require( './lib/resourceServer.js' ))( app )
  , templateServer = new (require( './lib/templateServer.js' ))( app )
  , dataServer = new (require( './lib/dataServer.js' ))( app, db );

resourceServer.serve( "/resources", __dirname + "/resources", __dirname );
templateServer.serve( "/templates", __dirname + "/resources/html/templates" );
dataServer.serve( "/data" );
logger.serve( app, "/debug" );

app.get( '/', function( req, res ) {
  res.sendfile( __dirname + "/resources/html/index.html" );
});

app.listen( config.port );
logger.log( "info", "Listening on port " + config.port + "." );

var startDate = new Date();
logger.log( "info", "Server started at " + startDate.toTimeString() + " on " + startDate.toDateString() + ".");