var config = require( '../lib/config.js' ),
    logger = require( '../lib/logger.js' );
    
var dbEngine = require( '../lib/db.js' ),
    db = dbEngine(config.dbConfig, logger);
var data = require( '../lib/data' )(),
    schemaGenerator = require( "../lib/rem/rem-sql-genschema" );

var schema = schemaGenerator( data.latest().model );
schema.version = data.latest().version.join(".");

console.log( schema );

var force = config.hasCLFlag( "--force", "-f" );
if ( force ) {
  logger.info( "Forcing recreation of the database.  All data will be lost." );
}

db.core.on( 'error', function( err ) {
  logger.error( "An error occurred.", err );
} );

function q( query ) {
  return db.core.query( query );;
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
  q( "CREATE TABLE IF NOT EXISTS DBINFO( Version integer )" )
  q( "DELETE FROM DBINFO" );
  q( "INSERT INTO DBINFO VALUES (" + schema.version + ")");
}

function doUpgradeFrom( currentVersion ) {
  if ( currentVersion === schema.version ) {
    logger.info( "Database up-to-date." );
    return;
  } else if ( currentVersion > schema.version ) {
    logger.warn( "The database version is greater than the current schema version, something is probably whack." );
    return;
  }

  // TODO: Do one upgrade

  logger.info( currentVersion + " --> " + (currentVersion+1) + " SUCCESS" );
  doUpgradeFrom( currentVersion+1 );
}

var query = q("SELECT count(*) AS count FROM information_schema.tables WHERE table_name = 'dbinfo';" );
query.on( 'row', function(row) {
  if ( row.count === 0 || force ) {
    dropAllTables();
    dropAllIndices();
    createTables();
    createIndices();
    updateVersion();
  } else {
    var upgraded = false;
    q( "SELECT Version FROM DBINFO LIMIT 1" )
      .on( "row", function( row ) {
        logger.info( "Current DB Version: " + row.version );
        logger.info( "Schema Version: " + schema.version );
        doUpgradeFrom( row.version );
        upgraded = true;
      }).on( "end", function() {
        if ( !upgraded ) {
          logger.warn( "The DBINFO table may not have any entries.  Upgrade skipped." );
        } else {
          logger.info( "Upgrade complete!" );
        }
      });
  }
});