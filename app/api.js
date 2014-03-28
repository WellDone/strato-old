var logger  = require( './lib/logger' ).start( 'api' ),
    config  = require( './lib/config' );

var Server = require( './lib/server' );

var server = new Server( 'api', {} );
var data = require( './lib/data' )();

data.serve( server.app, '/api' );

server.start();

