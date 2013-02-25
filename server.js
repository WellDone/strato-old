var express = require( 'express' );
var app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , stylus = require( 'stylus' )
  , nib = require( 'nib' )
  , fs = require( 'fs' )
  , winston = require( 'winston' ),
  , pg = require( 'pg' );

var DEBUG = process.env.NODE_DEVELOPMENT_MACHINE ? true : false;

var logger = new (winston.Logger)({
  transports: [
    new winston.transports.File({ filename: __dirname + "/debug/debug.log" })
  ]
});
if ( DEBUG ) {
  logger.add(winston.transports.Console);
  logger.log("debug", "Starting in DEBUG mode.");
} else {
  logger.log("Starting...");
}

function compileCSS(str, path) {
	return stylus(str)
		.set('filename', path)
		.set('compress', false)
		.use( nib() );
}
app.use( stylus.middleware({
	src: __dirname,
	compile: compileCSS
}));

app.get( '/', function( req, res ) {
	res.sendfile( __dirname + "/resources/html/index.html" );
});
app.use( '/resources', express.static( __dirname + "/resources" ) );
app.get( '/templates.json', function( req, res ) {
  var templateDir = __dirname + "/resources/html/templates",
      fileNames = fs.readdirSync( templateDir ),
      templates = {},
      i;
  for ( i=0; i<fileNames.length; ++i ) {
    var templateName = fileNames[i].substring( 0, fileNames[i].length - 5 ),
        template = fs.readFileSync( templateDir + "/" + fileNames[i], "utf8" );
    if ( template && template.length > 0 ) {
      templates[templateName] = template;
    }
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.write( JSON.stringify( templates ) );
  res.end();
});

var port = process.env.PORT || 3000;
app.listen( port );
logger.log( "Listening on port " + port + "." );

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    logger.log(data);
  });
});
