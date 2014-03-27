var logger  = require( './lib/logger' ).start( 'api' ),
    config  = require( './lib/config' );

var server = new require( './lib/server' )( 'api', {} );
var data = require( './lib/data' )();

data.serve( server.app, '/api' );

server.start();

