var express = require( 'express' ),
    app  = express();
app.use( express.urlencoded() );
app.use( express.json() );

var logger   = require( 'lib/logger' ).start();
var config   = require( 'lib/config' );
var dbEngine = require( 'lib/db' );

logger.info("CONFIG LOADED", JSON.stringify( config, null, 2 ) );

var db = dbEngine( config.dbConfig, logger );

db.connect();

// We have arrived!

var apiv1 = new (require( 'lib/api/apiv1' ))( app, config, db );
apiv1.serve( '/api/v1' );

var startDate = new Date();
logger.log( "info", "API Server started at " + startDate.toTimeString() + " on " + startDate.toDateString() + ".");
