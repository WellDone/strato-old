var pg = require( 'pg' ),
    logger = require( './logger.js' ).get();

module.exports = {
  connect: function( options ) {
    if ( !options || !options.url ) {
      logger.log( "Invalid options passed to 'db.connect'." );
    }
    var client = new pg.Client( options.url );
    client.connect(function(err) {
      if (err) {
        logger.log( "error", "An error occurred attempting to connect to the database", err )
      } else {
        logger.log( "info", "Successfully connected to the database!" );
      } });

    client.on( 'error', function(err){
      logger.log( "error", "A database error occurred: ", err );
    } );
    return client;
  }
};