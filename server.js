var express = require( 'express' );
var app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , stylus = require( 'stylus' )
  , nib = require( 'nib' );

//var DEBUG = process.env.NODE_DEVELOPMENT_MACHINE ? true : false;

function compileCSS(str, path) {
	return stylus(str)
		.set('filename', path)
		.set('compress', false)
		.use( nib() );
}
app.use( stylus.middleware({
	src: __dirname,
	compile: compileCSS
}))

app.get( '/', function( req, res ) {
	res.sendfile( __dirname + "/resources/html/index.html" );
});
app.use( '/resources', express.static( __dirname + "/resources" ) );

var port = process.env.PORT || 3000;
app.listen( port );
console.log( "Listening on port " + port + "." );

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});