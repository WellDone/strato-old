var logger  = require( './lib/logger' ).start( 'gateway' ),
    config  = require( './lib/config' );

var server = new require( './lib/server' )( 'gateway', {} );
var data = require( './lib/data' )( { version: 'latest', connectionPool: { min: 1, max: 10 } } );

// /gateway/<type> or /gateway/<type>/<version>
server.app.all( /^gateway\/([^\/]+)\/(\d+\/)?/, function( req, res ) {
	//TODO, use `data` programatically
} );

server.start();