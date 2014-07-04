var logger  = require( './lib/logger' ).start( 'gateway' ),
    config  = require( './lib/config' );

var Server = require( './lib/server' );

var server = new Server( 'gateway', {} );
var data = require( './lib/data' )( { version: 'latest', connectionPool: { min: 1, max: 10 } } );

var reportParser = require( './lib/reportParser' );


function processReport( from, body, timestamp, output ) {
	var report;
	try
	{
		report = reportParser( body );
	}
	catch ( e )
	{
		// TODO: Store the malformed report
		logger.error( "Failed to parse report." );
		logger.error( "   Body: " + body );
		logger.error( "  Error: " + e );
		output(e);
		return;
	}

	report = {
		timestamp: timestamp,
		data: JSON.stringify( report )
	};

	data.r('monitors').get( { fields: ['id','gsmid'], where: { gsmid: from } }, function( err, result ) {
		if ( err )
		{
			output( err )
			return;
		}
		if ( !result || result.length == 0 )
		{
			var monitor = {
				name: from,
				gsmid: from
			}
			data.r('monitors').add( monitor, function(err) {
				if ( err )
				{
					output( err );
					return;
				}
				data.r('monitors').get({fields: ['id', 'gsmid'], where: { gsmid: from } }, function( err, result) {
					if ( err || !result || result.length == 0 )
					{
						output( err? err : "No monitor found" );
						return;
					}

					report.monitor = result[0].id;
					data.r('reports').add( report, output );
				})
			})
		}
		else
		{
			report.monitor = result[0].id;
			data.r('reports').add( report, output );
		}
	});
}

function processSMS( req, res, gatewayVersion ) {
	if ( req.method == 'POST' && !req.body || req.method == 'GET' && !req.query )
	{
		res.send( 400, "Invalid request." );
		return false;
	}

	var body = req.query.text || req.body.Body || req.body.message || req.body.text;
  var from = req.query.msisdn || req.body.From || req.body.from || req.body.msisdn;
  var timestamp = req.body.sent_timestamp;
  if (timestamp) {
    timestamp = parseInt(timestamp)
    if ( !isNaN(timestamp) ) {
      timestamp = new Date(timestamp);
    } else {
      console.log( "Discarding invalid timestamp " + req.body.sent_timestamp );
      timestamp = null;
  }
    }
  if ( !timestamp )
  	timestamp = new Date();

  if ( body && from ) {
	  processReport( from, body, timestamp, function( err, output ) {
	  	if ( err ) {
	  		res.send( 500, "Something bad happened: " + err );
	  		return;
	  	}
	  	res.writeHead( 200 );
	    if (req.body.message) // This came from SMSSync
	    {
	      res.write( "{payload:{success:\"true\"}}" );
	    }
	    console.log( "Successfully processed report." );
	    res.end();
	  } );
	} else {
		res.writeHead( 200 );
		res.write( "Malformed request." );
		console.log( "Malformed request." );
		console.log( req.body );
		res.end();
	}
}

// /gateway/<type> or /gateway/<type>/<version>
server.app.all( /^\/gateway\/([^\/]+)(\/\d+)?/, function( req, res ) {
	if ( req.params[0].toLowerCase() == 'sms' )
	{
		if ( req.method != 'POST' && req.method != 'GET' )
		{
			res.send( 404, "Invalid gateway HTTP method." );
			return;
		}
		processSMS( req, res, parseInt( req.params[1] ) );
	}
	else
	{
		res.send( 404, "Not a valid gateway" );
	}
} );

server.start();