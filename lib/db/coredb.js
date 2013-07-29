var pg = require( 'pg' );

module.exports = function( url, logger )
{
  logger.info( "CoreDB URL:", url );

  var pgdb = new pg.Client( url );
  pgdb.connect(function(err) {
    if (err) {
      logger.error( "An error occurred attempting to connect to the Postgres database:", err )
    } else {
      logger.info( "Successfully connected to the Postgres database!" );
    }
  });
  pgdb.on( 'error', function(err){
    logger.error( "A database error occurred:", err );
  } );
  return pgdb;
}