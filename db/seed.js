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
  logger.info( query );
  var _q = db.core.query( query );
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

dates = [];
for ( var i=5; i<26; ++i ) {
  dates.push( "2013-02-" + String(i) );
}

function dropAllFromTable( table) {
  logger.info( "Deleting all entries in " + table + "..." );
  q( "DELETE FROM " + table );
}

setTimeout( function() {
if ( clean ) {
  if ( process.argv.length != 3 ) {
    console.log( "USAGE: node seed.js --clean" );
    console.log( "       node seed.js [seedFile]" );
    process.exit(1);
  }
  console.log( "Cleaning the DB.  Goodbye." );
  dropAllFromTable( "malformed_reports" );
  dropAllFromTable( "aggregate_reports" );
  dropAllFromTable( "monitors" );
  dropAllFromTable( "sites" );
  return;
} else {
  var seedFile;
  if ( process.argv.length == 2 ) {
    seedFile = './data/test.seed';
  } else if ( process.argv.length == 3 ) {
    seedFile = process.argv[2];
  } else {
    console.log( "USAGE: node seed.js --clean" );
    console.log( "       node seed.js [seedFile]" );
    process.exit(1);
  }
  var data = require( seedFile );
  console.log( "Seeding database.  " + data.length + " site." );
  for ( var i=0; i<data.length; ++i ) {
    q("INSERT INTO sites( id, name, country ) VALUES (" + i + ",'" + data[i].name + "','" + data[i].country + "')" ).on( 'end', function(i) {
      console.log(data);
      console.log(i);
      for ( var j=0; j<data[i].monitors.length; ++j ) {
        var m = data[i].monitors[j];
        var av = 650 / 8 + Math.random() * 20 - 10;
        av *= m._functionality;
        if ( !m.breakdown ) {
          m.breakdown = dates.length;
        }
        q( "INSERT INTO monitors( id, GSMID, name, location, siteid ) VALUES (" + j + "," + j + ",'" + m.name + "','(" + m.lat + "," + m.lng + ")'," + i + ")" )
        .on( 'end', function( j, av, breakdown ) {
          for ( var k=0; k<dates.length; ++k ) {
            var v = (k>=breakdown)?4:av + Math.random() * 30 - 15;
            q( "INSERT INTO aggregate_reports( timestamp, eventcount, monitorid ) VALUES ('" + dates[k] + "'," + v + "," + j + ")");
          }
        }.bind( null, j, av, m.breakdown ) );
      }
    }.bind(null, i) )
  }
}
}, 500 );
