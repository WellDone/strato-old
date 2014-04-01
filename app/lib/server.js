var logger  = require( './logger' ),
    config  = require( './config' );

var express  = require( 'express' );

function Server( name, options ) {
	if ( !name )
		throw new Error( "Server name is required." );
	this.name = name;
	this.app = express();

	var winstonStream = {
    write: function(message, encoding){
       logger.info(message);
    }
	};

	//this.app.use(express.logger({stream:winstonStream}));

	this.app.use(function(req, res, next){
	  logger.info('%s %s %s', req.method, req.url, req.body || "<no body>" );
	  next();
	});

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
	logger.info( "Server '" + this.name + "' (port " + port + ") started at " + startDate.toTimeString() + " on " + startDate.toDateString() + "." );
}

module.exports = Server;