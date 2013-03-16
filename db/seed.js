var config = require( '../lib/config.js' ),
    dbEngine = require( '../lib/db.js' ),
    logger = new (require( '../lib/logger.js' ))( __dirname ),
    db = dbEngine.connect( { url: config.databaseURL, logger: logger } ),
    data = require( './dummyData.js' );

db.on( 'error', function( err ) {
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

dropAllFromTable( "monitors" );
dropAllFromTable( "monitors" );
dropAllFromTable( "sites" );

for ( var i=0; i<data.length; ++i ) {
  q("INSERT INTO sites( id, name, country ) VALUES (" + i + ",'" + data[i].name + "','" + data[i].country + "')" )
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
