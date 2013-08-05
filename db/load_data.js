// Loads data from JSON/CSV file into Postgres database

// Initialize node handling of database
var config = require( '../lib/config.js' ),
    logger = require( '../lib/logger.js' ).start( __dirname ),
    db = require( '../lib/db.js' )( config.dbConfig, logger )

var clean = config.hasCLFlag( "--clean" );

db.core.on( 'error', function( err ) {
  logger.error( "An error occurred.", err );
} );

// Function to send queries to DB
var queryCount = 0;
function q( query ) {
  ++queryCount;
  //logger.info( query );
  var _q = db.core.query( query );
  _q.on( 'end', function() {
    --queryCount;
    if ( queryCount === 0 ) {
      setTimeout( function() {
        if ( queryCount === 0 ) {
          db.core.end();
        }
      }, 500 );
    }
  } );
  return _q;
}

function dropAllFromTable( table ) {
  logger.info( "Deleting all entries in " + table + "..." );
  q( "DELETE FROM " + table );
}

setTimeout( function() {

  if (process.argv.length > 3) {
      console.log( "USAGE: node load_data.js --clean" );
      console.log( "       node load_data.js [loadDir]" );
      process.exit(1);
      return;
  }

  if ( clean ) {
    console.log( "Cleaning the DB first..." );
    dropAllFromTable( "malformed_reports" );
    dropAllFromTable( "aggregate_reports" );
    dropAllFromTable( "monitors" );
    dropAllFromTable( "sites" );
    console.log( "done." );
  }

  if ( (process.argv.length == 2)) {
      loadDir = './data/';
  } else if ( (process.argv.length == 3) && (!clean) ) {
      loadDir = process.argv[2];
  } 

  // Import sites data into postgres SQL DB  
  var sites    = require( './data/sites.json' );
  console.log( "Importing " + sites.length + " sites." );
  for ( var i=0; i<sites.length; ++i ) {
    q("INSERT INTO sites( id, name, country ) VALUES (" + sites[i].ID+ ",'" + sites[i].City + "','" + sites[i].Country + "')" )
  };

  // Import monitors data into postgres SQL DB  
  var monitors = require( './data/monitors.json' );
  console.log( "Importing " + monitors.length + " monitors." );
  for ( var i=0; i<monitors.length; ++i ) {
    q( "INSERT INTO monitors( id, GSMID, name, location, siteid ) VALUES (" + monitors[i].ID + "," + i + ",'" + monitors[i].Name + "','(" + monitors[i].Lon + "," + monitors[i].Lat + ")'," + monitors[i].SiteID + ")" )
  };

  // Import reports data into postgres SQL DB  
  var reports  = require( './data/reports.json' );
  console.log( "Importing " + reports.length + " reports." );
  for ( var i=0; i<reports.length; ++i ) {
    q( "INSERT INTO aggregate_reports( timestamp, eventcount, batteryvoltage, monitorid ) VALUES ('" + reports[i].Timestamp + "'," + reports[i].EventCount + "," + reports[i].BatteryVoltage + "," + reports[i].MonitorID + ")");
  };

}, 500 );
