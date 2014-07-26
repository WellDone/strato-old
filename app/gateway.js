var logger  = require( './lib/logger' ).start( 'gateway' );

var Server = require( './lib/server' );
var server = new Server( 'gateway', {} );

var gatewayHandlers = {
	'twilio': require('./lib/gateways/twilio'),
	'smssync': require('./lib/gateways/smssync'),
	'telerivet': require('./lib/gateways/telerivet'),
	'nexmo': require('./lib/gateways/nexmo')
}

// /gateway/<type> or /gateway/<type>/<version>
server.app.all( /^\/gateway\/([^\/]+)(\/\d+)?/, function( req, res ) {
	var gatewayType = req.params[0].toLowerCase();
	var gatewayVersion = req.params[1]? parseInt( req.params[1] ) : null;

	if ( gatewayVersion != null && isNaN( gatewayVersion ) )
		return res.write( 500, "Invalid gateway version." );
	if ( !gatewayHandlers[gatewayType] )
		return res.send( 404, "Gateway not found." );
	
	gatewayHandlers[gatewayType]( req, res, gatewayVersion );
} );

server.start();