var reportProcessor = require( '../reportProcessor' );

function telerivetCallbackHandler( req, res, gatewayVersion ) {
  if ( req.method != 'POST' )
  {
    res.send( 404, "Invalid gateway HTTP method." );
    return;
  }

  var timestamp = new Date( parseInt( req.body.time_sent || req.body.time_created ) * 1000 );
  if ( isNaN( timestamp ) )
    return res.send( 400, "Invalid timestamp input." );
  reportProcessor( req.body.content,
                   req.body.from_number,
                   timestamp,
   function( err ) {
    res.send( 200 );
   } );
 }

module.exports = telerivetCallbackHandler;