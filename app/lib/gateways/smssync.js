var reportProcessor = require( '../reportProcessor' );

function smssyncCallbackHandler( req, res, gatewayVersion ) {
  if ( req.method != 'POST' )
  {
    res.send( 404, "Invalid gateway HTTP method." );
    return;
  }

  var timestamp = new Date( parseInt( req.body.sent_timestamp ) );
  if ( isNaN( timestamp ) )
    return res.send( 400, "Invalid timestamp input." );
  reportProcessor( req.body.message,
                   req.body.from,
                   timestamp,
   function( err ) {
    var result = { payload: {} };
    if ( !err ) {
      result.payload.success = true;
      result.payload.error = null;
    } else {
      result.payload.success = false;
      result.payload.error = ""+err;
    }
    res.send( 200, JSON.stringify( result ) );
   } );
}

module.exports = smssyncCallbackHandler;