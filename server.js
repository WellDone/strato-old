var express = require( 'express' );

var app = express();

app.get( '/', function( req, res ) {
	res.sendfile( __dirname + "/resources/html/index.html" );
});
app.use( '/resources', express.static( __dirname + "/resources" ) );

var port = process.env.PORT || 3000;
app.listen( port );
console.log( "Listening on port" + port + "." );