var config = require( '../lib/config.js' ),
    logger = require( '../lib/logger.js' );
    
var dbEngine = require( '../lib/db.js' ),
    db = dbEngine(config.dbConfig, logger);
var data = require( '../lib/data' )(),
    schemaGenerator = require( "../lib/rem/rem-sql-genschema" );

var schema = data.backend.schema( data.latest().model );;
schema.version = data.latest().version.join(".");

var force = config.hasCLFlag( "--force", "-f" );
if ( force ) {
  logger.info( "Forcing recreation of the database.  All data will be lost." );
}

db.core.on( 'error', function( err ) {
  logger.error( "An error occurred.", err );
} );

var queryCount = 0;
function q( query ) {
  var query = db.core.query( query );
  ++queryCount;
  query.on( 'end', function() {
    --queryCount;
    if ( queryCount <= 0 )
      process.exit()
  });
  return query;
}

function dropSchema() {
  logger.info( "Blowing away existing schema..." );
  for ( var t in schema.tables ) {
    q( "drop table if exists " + t + " cascade" );
  }
  for ( var i in schema.indices ) {
    q( "drop table if exists " + i + " cascade" );
  }
}

function initSchema() {
  q( data.latest().schemaString() )
    .on( 'end', function() {
      logger.info( "Database schema initialized." );
    } ); 
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
    dropSchema();
    initSchema();
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