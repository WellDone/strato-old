var pg = require( 'pg' );

module.exports = {
  connect: function( options ) {
    if ( !options || !options.url ) {
      console.log( "Invalid options passed to 'db.connect'." );
    }
    if ( !options.logger ) { options.logger = console; }
    var client = new pg.Client( options.url );
    client.connect(function(err) {
    if (err) {
      options.logger.log( "error", "An error occurred attempting to connect to the database", err )
    } else {
      options.logger.log( "info", "Successfully connected to the database!" );
    } });
    return client;
  }
};