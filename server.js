var express = require( 'express' );
var app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , stylus = require( 'stylus' )
  , nib = require( 'nib' )
  , fs = require( 'fs' )
  , winston = require( 'winston' )
  , pg = require( 'pg' )
  , startDate = new Date();

var DEBUG = process.env.NODE_DEBUG_MODE ? true : false;
var pgConnectionString = process.env.DATABASE_URL;

var logger = new (winston.Logger)({
  transports: [
    new winston.transports.File({ filename: __dirname + "/debug/debug.log" })
  ]
});
if ( DEBUG ) {
  logger.add(winston.transports.Console);
  logger.log( "debug", "DEBUG MODE!");
}

logger.log( "info", "Server started at " + startDate.toTimeString() + " on " + startDate.toDateString() + ".");

var pgClient = new pg.Client( pgConnectionString );
pgClient.connect(function(err) {
  if (err) {
    logger.log( "error", "An error occurred attempting to connect to the database", error )
  } else {
    logger.log( "info", "Successfully connected to the database!" );
  }
});

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
app.get( '/sites.json', function( req, res ) {
  var sites = [
    {
      id: 0,
      name: "Test Site",
      country: "Kenya",
      monitors: [
        { name: "Olenguruone District Hospital",
          loc: { lat: -0.59103333333, lng: 35.68551667} },
        { name: "Mogotio Clinic",
          loc: { lat: -0.024783, lng: 35.966767 } },
        { name: "ABC Kanyuuni School CHANGED!!!",
          loc: { lat: 1.10015, lng:38.07315 } } ]
    }
  ];
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.write( JSON.stringify( sites ) );
  res.end();
})

var port = process.env.PORT || 3000;
app.listen( port );
logger.log( "Listening on port " + port + "." );

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    logger.log(data);
  });
});
