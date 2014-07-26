var reportProcessor = require( '../reportProcessor' );

function twilioCallbackHandler( req, res, gatewayVersion ) {
  if ( req.method != 'POST' )
  {
    res.send( 404, "Invalid gateway HTTP method." );
    return;
  }

  reportProcessor( req.body.Body,
                   req.body.From,
                   new Date(),
   function( err ) {
    res.send( 200 );
   } );
}

module.exports = twilioCallbackHandler;