var https = require( 'https' );

//var b64str = "AQAsAAAAAP8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
//console.log( b64str );
var sequence = 0;

function ConstructReport( value ) {
  var bytes = new Buffer(104);
  // bytes[0] = 1; //version
  // bytes[1] = 1; //currentHour
  // bytes.writeUInt16BE( 49189, 2 ); //currentHour
  // bytes[4] = 0; //hour count
  // bytes[5] = value || Math.floor((Math.random()*50)+1); //event count
  // bytes[6] = 4; //sensor type
  // bytes[7] = 0; //unused
  // for (var i=8; i<104;) {
  //   bytes.writeUInt32LE( Math.floor(Math.random()*100), i )
  //   i+=4;
  // }

  bytes[0] = 2; //version
  bytes[1] = 42; //sensor ID
  bytes.writeUInt16LE( sequence++, 2 );
  bytes.writeUInt16LE( 0, 4 ); //flags
  bytes.writeUInt16LE( 650, 6 ); //battery voltage
  bytes.writeUInt16LE( 0, 8 ); //diagnostics1
  bytes.writeUInt16LE( 0, 10 ); //diagnostics2
  bytes[12] = 0x61; // count, min, max
  bytes[13] = 0x04; // count, mean
  bytes[14] = 0x60;
  bytes[15] = 0x0A;

  bytes.writeUInt16LE( Math.floor(Math.random()*100)*10, 16 ) //count
  bytes.writeUInt16LE( Math.floor(Math.random()*200), 18 ) //min
  bytes.writeUInt16LE( Math.floor(Math.random()*200)+800, 20 ) //max

  for ( var i = 0; i < 10; ++i ) {
    bytes.writeUInt16LE( Math.floor(Math.random()*100), 22+(i*4) ) //count
    bytes.writeUInt16LE( Math.floor(Math.random()*600)+200, 24+(i*4) ) //mean
  }

  return bytes.toString( 'base64' );
}

function SendFakeReport() {
  var data = {
    From: "+123456",
    Body: ConstructReport()
  }
  var payload = JSON.stringify( data )
  console.log( payload );
  
  var options = {
    hostname: 'localhost',
    port: 3001,
    path: '/gateway/twilio',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    },
    method: 'POST',
    data: data,
    rejectUnauthorized: false,
    agent:false
  };
  var req = https.request(options, function(res) {
    if ( res.statusCode != 200 )
    {
      console.log( "FAILED" );
      console.log("statusCode: ", res.statusCode);
      console.log("headers: ", res.headers);
    }
    res.on('data', function(d) {
      process.stdout.write(d);
    });
    res.on('end', function() {
      process.stdout.write('\n');
    })
    setTimeout( SendFakeReport, 60000 );
  });
  req.write( payload )
  req.end();

  req.on( 'error', function(e) {
    console.log( "ERROR: " + e );
  } )
}

SendFakeReport();
