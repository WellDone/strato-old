var logger  = require( './lib/logger' ),
    config  = require( './lib/config' );

var express  = require( 'express' );

function Server( name, options ) {
	if ( !name )
		throw new Error( "Server name is required." );
	this.name = name;
	this.app = express();

	if ( !options )
		options = {};
	this.options = options;
}

Server.prototype.start = function() {
	var port = this.options.port || config.ports[this.name];
	if ( !port )
		throw new Error( "No port specified." );

	this.app.listen( port );

	var startDate = new Date();
	logger.info( "Server '" + this.name + "' (internal port " + port + ") started at " + startDate.toTimeString() + " on " + startDate.toDateString() + "." );
}

module.exports = Server;