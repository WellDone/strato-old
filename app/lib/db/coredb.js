var pg = require( 'pg' );

module.exports = function( url, logger )
{
  logger.info( "CoreDB URL:", url );

  var pgdb = new pg.Client( url );
  var retryCount = 1;
  function attemptToConnect() {
    if (retryCount == 0)
    {
      logger.error( "Failed to connect to Postgres database, rety count exceeded.  Ragequit." );
      process.exit(1);
    }
    pgdb.connect(function(err) {
      if (err) {
        retryCount = retryCount-1;
        //setTimeout( attemptToConnect, 10000 );
        logger.error( "An error occurred attempting to connect to the Postgres database (" + retryCount + " attempts remaining):", err );
      } else {
        logger.info( "Successfully connected to the Postgres database!" );
      }
    });
    pgdb.on( 'error', function(err){
      logger.error( "A database error occurred:", err );
    } );
  }
  attemptToConnect();
  return pgdb;
}