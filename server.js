var config = require('./lib/config');

var express = require( 'express' ),
    app = express();

app.use(express.bodyParser());

var logger = require( './lib/logger' ).start();
logger.info("CONFIG LOADED", JSON.stringify( config, null, 2 ) );
var db = require( './lib/db' )(config.dbConfig, logger);

var momoData = new (require( './lib/momoData' ))( db );

var resourceServer = new (require( './lib/resourceServer' ))( app )
  , templateServer = new (require( './lib/templateServer' ))( app )
  , dataServer = new (require( './lib/dataServer' ))( app, momoData );

resourceServer.serve( "/resources", __dirname + "/resources", __dirname );
templateServer.serve( "/templates", __dirname + "/resources/html/templates" );
dataServer.serve( "/data" );
dataServer.listen( "/sms" );
logger.serve( app, "/debug" );

app.get( '/', function( req, res ) {
  res.sendfile( __dirname + "/resources/html/index.html" );
});

app.listen( config.port );
logger.log( "info", "Listening on port " + config.port + "." );

var startDate = new Date();
logger.log( "info", "Server started at " + startDate.toTimeString() + " on " + startDate.toDateString() + ".");