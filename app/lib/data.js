var logger = require( './lib/logger' ),
    config = require( './lib/config' );

var REM    = require( './lib/rem' ),

module.exports = function( options )
{
	if ( !options )
		options = {};
	var api = new REM( {
		path: './data/models',
		db: {
			url: config.dbConfig.core_url,
			connectionPool: ( options.connectionPool || { min: 2, max: 10 } )
		},
		logger: logger
	});

	if ( options.version || options.version === 0 )
		return api.v( options.version );
	else
		return api;
}