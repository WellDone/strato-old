var logger  = require( './lib/logger' ).start( 'gateway' ),
    config  = require( './lib/config' );

var Server = require( './lib/server' );

var server = new Server( 'gateway', {} );
var data = require( './lib/data' )( { version: 'latest', connectionPool: { min: 1, max: 10 } } );

// /gateway/<type> or /gateway/<type>/<version>
server.app.post( /^\/gateway\/([^\/]+)(\/\d+)?/, function( req, res ) {
	//TODO, use `data` programatically
	res.send( 200, "Gateway OK" );
} );

server.start();