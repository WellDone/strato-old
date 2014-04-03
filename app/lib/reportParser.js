function getBatteryVoltage( rawValue ) {
  return rawValue / 1024 * 2.78 * 2;
}

function parseReport( reportValue ) {
  var reportBytes = new Buffer( reportValue, 'base64' );
  var report = {};
  report.version = reportBytes[0];
  if ( report.version & 0x80 ) {
    // Registration
    report.isRegistration = true;
    report.version &= 0x7F; //Mask out the high registration marker bit.
    if ( report.version == 0 ) {
      report.errorCount = reportBytes[1];
      return report;
    } else {
      console.log( "Unrecognized registration version." );
      return;
    }
  }
  else if ( report.version == 1 ) //TODO: Make extensible
  {
    if ( reportBytes.length != 104 ) {
      console.log( "Poorly fmapormed report.");
      return;
    }
    report.currentHour = reportBytes[1]
    report.batteryVoltage = getBatteryVoltage( reportBytes.readUInt16LE(2) );
    report.hourCount = reportBytes[4];
    report.eventCount = reportBytes[5]
    report.sensorType = reportBytes[6];
    var __unused = reportBytes[7]
    var bucketString = reportBytes.slice(8);
    report.buckets = [];
    for (var i=0; i<24; ++i)
    {
      report.buckets[i] = bucketString.readUInt32LE(i*4);
    }
    console.log( "Parsed report." );
    console.log( report );
    return report;
  } else {
    throw new Error( "Unrecognized MoMo report version " + momoReportVersion + "." );
  }
}

module.exports = parseReport;