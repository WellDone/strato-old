// Loads data from JSON/CSV file into Postgres database

var config = require( '../lib/config.js' ),

    logger = require( '../lib/logger.js' ).start( __dirname ),
    dbEngine = require( '../lib/db.js' ),
    db = dbEngine.connect( { url: config.databaseURL, logger: logger } );

var clean = config.hasCLFlag( "--clean" );

db.on( 'error', function( err ) {
  logger.error( "An error occurred.", err );
} );

var queryCount = 0;
function q( query ) {
  ++queryCount;
  //logger.info( query );
  var _q = db.query( query );
  _q.on( 'end', function() {
    --queryCount;
    if ( queryCount === 0 ) {
      setTimeout( function() {
        if ( queryCount === 0 ) {
          db.end();
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
  if ( clean ) {
    if ( process.argv.length != 3 ) {
      console.log( "USAGE: node load_data.js --clean" );
      console.log( "       node load_data.js [seedFile]" );
      process.exit(1);
    }
    console.log( "Cleaning the DB.  Goodbye." );
    dropAllFromTable( "malformed_reports" );
    dropAllFromTable( "aggregate_reports" );
    dropAllFromTable( "monitors" );
    dropAllFromTable( "sites" );
    return;
  } else {

    if ( process.argv.length == 2 ) {
        loadDir = './data/';
    } else if ( process.argv.length == 3 ) {
        loadDir = process.argv[2];
    } else {
        console.log( "USAGE: node load_data.js --clean" );
        console.log( "       node load_data.js [loadDir]" );
        process.exit(1);
    }

    // Import data into postgres SQL DB  
    var sites    = require( './data/sites.json' );
    console.log( "Importing " + sites.length + " sites." );
    for ( var i=0; i<sites.length; ++i ) {
      q("INSERT INTO sites( id, name, country ) VALUES (" + sites[i].ID+ ",'" + sites[i].City + "','" + sites[i].Country + "')" )
    };

    var monitors = require( './data/monitors.json' );
    console.log( "Importing " + monitors.length + " monitors." );
    for ( var i=0; i<monitors.length; ++i ) {
      q( "INSERT INTO monitors( id, GSMID, name, location, siteid ) VALUES (" + monitors[i].ID + "," + i + ",'" + monitors[i].Name + "','(" + monitors[i].Lat + "," + monitors[i].Lon + ")'," + monitors[i].SiteID + ")" )
    };

    var reports  = require( './data/reports.json' );
    console.log( "Importing " + reports.length + " reports." );
    for ( var i=0; i<reports.length; ++i ) {
      q( "INSERT INTO aggregate_reports( timestamp, eventcount, batteryvoltage, monitorid ) VALUES ('" + reports[i].Timestamp + "'," + reports[i].EventCount + "," + reports[i].BatteryVoltage + "," + reports[i].MonitorID + ")");
    };
  };

}, 500 );
