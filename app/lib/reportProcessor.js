var reportParser = require( './reportParser' );
var data = require( './data' )( { version: 'latest', connectionPool: { min: 1, max: 10 } } );
var logger = require( './logger' )

function processReport( body, from, timestamp, callback ) {
	logger.info( "Processing Report..." );
	logger.info( "   From: " + from );
	logger.info( "   Body: " + body );
	logger.info( "   Time: " + timestamp );

	var output = function( err ) {
		if ( err ) {
			logger.error( "Failed to process report." );
			logger.error( "  Error: " + err );
		}
		else
		{
			logger.info( "Successfully processed." );
		}
		return callback( err );
		// TODO: Store the malformed report
	}

	var report;
	try
	{
		report = reportParser( body );
	}
	catch ( e )
	{
		return output( e );
	}

	report = {
		timestamp: timestamp,
		data: JSON.stringify( report )
	};

	data.r('monitors').get( { fields: ['id','gsmid'], where: { gsmid: from } }, function( err, result ) {
		if ( err )
		{
			return output( err )
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
					return output( err );
				}
				data.r('monitors').get({fields: ['id', 'gsmid'], where: { gsmid: from } }, function( err, result) {
					if ( err || !result || result.length == 0 )
					{
						return output( err? err : "No monitor found" );
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

module.exports = processReport;