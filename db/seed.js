var seedFile;
if ( process.argv.length == 2 ) {
  seedFile = './data/test.seed';
} else if ( process.argv.length == 3 ) {
  seedFile = process.argv[2];
} else {
  console.log( "USAGE: node seed.js [opt:seedFile]" );
  process.exit(1);
}

var config = require( '../lib/config.js' ),
    logger = require( '../lib/logger.js' ).start( __dirname ),
    dbEngine = require( '../lib/db.js' ),
    db = dbEngine.connect( { url: config.databaseURL, logger: logger } );

var data = require( seedFile );

console.log( seedFile );
console.log( data );

db.on( 'errow', function( err ) {
  logger.error( "An error occurred.", err );
} );

var queryCount = 0;
function q( query ) {
  ++queryCount;
  logger.info( query );
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

dates = [];
for ( var i=5; i<26; ++i ) {
  dates.push( "2013-02-" + String(i) );
}

function dropAllFromTable( table) {
  logger.info( "Deleting all entries in " + table + "..." );
  q( "DELETE FROM " + table );
}

setTimeout( function() {
  console.log( "Seeding database.  " + data.length + " site." );
  for ( var i=0; i<data.length; ++i ) {
    q("INSERT INTO sites( name, country ) VALUES ('" + data[i].name + "','" + data[i].country + "')" )
    for ( var j=0; j<data[i].monitors.length; ++j ) {
      var m = data[i].monitors[j];
      var av = 650 / 8 + Math.random() * 20 - 10;
      av *= m._functionality;
      if ( !m.breakdown ) {
        m.breakdown = dates.length;
      }
      q( "INSERT INTO monitors( id, name, location, siteid ) VALUES (" + j + ",'" + m.name + "','(" + m.lat + "," + m.lng + ")'," + i + ")" )
      .on( 'end', function( j, av, breakdown ) {
        for ( var k=0; k<dates.length; ++k ) {
          var v = (k>=breakdown)?4:av + Math.random() * 30 - 15;
          q( "INSERT INTO reports( date, volume, monitorid ) VALUES ('" + dates[k] + "'," + v + "," + j + ")");
        }
      }.bind( null, j, av, m.breakdown ) );
    }
  }
}, 1000 );