var logger   = require( './lib/logger' ),
    config   = require( './lib/config' );

var REM      = require( './lib/rem' ),
    express  = require( 'express' ),
    app      = express();

logger.info("CONFIG LOADED", JSON.stringify( config, null, 2 ) );

var api = new REM( {
	path: './data/models',
	db: {
		url: config.dbConfig.core_url,
		connectionPool: { min: 2, max: 10 }
	},
	logger: logger
});

var startDate = new Date();
logger.info( "API Server started at " + startDate.toTimeString() + " on " + startDate.toDateString() + "." );

api.serve( app, '/api' );
app.listen( config.port || 10000 );