var reportProcessor = require( '../reportProcessor' );

function nexmoCallbackHandler( req, res, gatewayVersion ) {
  if ( req.method != 'POST' )
  {
    res.send( 404, "Invalid gateway HTTP method." );
    return;
  }

  var timestamp = new Date( req.body["message-timestamp"] );
  reportProcessor( req.body.text,
                   req.body.msisdn,
                   timestamp,
   function( err ) {
    res.send( 200 );
   } );
}

module.exports = nexmoCallbackHandler;