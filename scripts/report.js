var http = require( 'http' );

//var b64str = "AQAsAAAAAP8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
//console.log( b64str );
function ConstructReport( value ) {
  var bytes = new Buffer(104);
  bytes[0] = 1; //version
  bytes[1] = 1; //currentHour
  bytes.writeUInt16BE( 49189, 2 ); //currentHour
  bytes[4] = 0; //hour count
  bytes[5] = value || Math.floor((Math.random()*50)+1); //event count
  bytes[6] = 4; //sensor type
  bytes[7] = 0; //unused
  for (var i=8; i<104;) {
    bytes.writeUInt32LE( Math.floor(Math.random()*100), i )
    i+=4;
  }

  return bytes.toString( 'base64' );
}

function SendFakeReport() {
  var options = {
    host: 'localhost',
    port: 3000,
    path: '/gateway/sms',
    headers: {
      'Content-Type': 'Application/json'
    },
    method: 'POST',
    agent:false
  };
  var req = http.request(options, function(res) {
    setTimeout( SendFakeReport, 1000 );
    console.log( "OK" );
  });
  req.on( 'error', function(e) {
    console.log( "ERROR: " + e );
  } )

  var data = {
    From: "+123456",
    Body: ConstructReport()
  }
  var payload = JSON.stringify( data )
  console.log( payload );
  req.write( payload )
  req.end();
}

SendFakeReport();
