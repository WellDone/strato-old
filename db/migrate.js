var config = require( '../lib/config.js' ),
    dbEngine = require( '../lib/db.js' ),
    logger = new (require( '../lib/logger.js' ))( __dirname ),
    db = dbEngine.connect( { url: config.databaseURL, logger: logger } ),
    schema = require( "./schema.js" );

db.on( 'error', function( err ) {
  logger.error( "An error occurred.", err );
} );

var queryCount = 0;
function q( query ) {
  ++queryCount;
  var _q = db.query( query );
  _q.on( 'end', function() {
    --queryCount;
    if ( queryCount === 0 ) {
      db.end();
    }
  } );
  return _q;
}

function dropAllTables() {
  logger.info( "Deleting all tables..." );
  Object.keys( schema.tables ).forEach( function( table ) {
    q( "DROP TABLE IF EXISTS " + table + " CASCADE" );
  });
}

function createTables() {
  Object.keys( schema.tables ).forEach( function( table ) {
    q( "CREATE TABLE IF NOT EXISTS " + table + "(" + schema.tables[table] + ")" )
      .on( 'end', function() {
        logger.info( "Created table " + table );
       } );
  });
}

function dropAllIndices() {
  logger.info( "Deleting all indices...");
  Object.keys( schema.indices ).forEach( function( idx ) {
    q( "DROP INDEX IF EXISTS " + idx );
  });
}

function createIndices() {
  Object.keys( schema.indices ).forEach( function( idx ) {
    q( "CREATE INDEX " + idx + " " + schema.indices[idx] )
      .on( 'end', function() {
        logger.info( "Created index " + idx );
      });
  });
}

function updateVersion() {

}

var query = q("SELECT count(*) AS count FROM information_schema.tables WHERE table_name = 'dbinfo';" );
query.on( 'row', function(row) {
  if ( row.count === 0 ) {
    dropAllTables();
    dropAllIndices();
    createTables();
    createIndices();
  } else {
    logger.info( "The database already exists." );
  }
});