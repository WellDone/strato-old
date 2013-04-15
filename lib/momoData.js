var logger = require( './logger.js' ).get();
var first_responders = [
  "+17078159250",
  "+"
]

momoData = function( db ) {
  this.db = db;
}

momoData.prototype = {
  runAddMonitorQuery: function( gsmid ) {
    var query =
      this.db.query({ text: "INSERT INTO monitors ( name, location, gsmid, siteid ) VALUES ($1,'(9.4969, 36.8961)',$2,$3) RETURNING id",
                      values: ["new monitor (" + gsmid + ")",
                               gsmid,
                               1 ] })
        .on( 'error', function( err ) {
          console.log(err);
        });
      return query;
  },
  runStoreReportQuery: function( monitorID, report ) {
    var query = this.db.query({
                    text: "INSERT INTO aggregate_reports ( date, monitorid, raw, batteryvoltage, sensortype, currenthour, hourcount, eventcount, hourlypulses ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
                    values: [report.received,
                             monitorID,
                             report.raw,
                             report.batteryVoltage,
                             report.sensorType,
                             report.currentHour,
                             report.hourCount,
                             report.eventCount,
                             "{" + report.buckets.join() + "}" ] })
      .on( 'error', function( err ) {
        console.log(err);
      });
    return query;
  },
  processRegistration: function( registration ) {
    var found = false;
    var self = this;
    this.db.query( "SELECT id FROM monitors WHERE gsmid = '" + registration.from + "'" )
      .on( 'row', function(row) {
        console.log( "A monitor with this GSM number (id:" + row.id + ") already exists." );
        found = true;
      })
      .on( 'end', function() {
        if ( !found ) {
          self.runAddMonitorQuery( registration.from );
        } else {
          console.log( "Discarding duplicate registration." );
        }
      });
  },
  storeReport: function( report ) {
    var monitorID;
    var self = this;
    this.db.query( "SELECT id,gsmid FROM monitors WHERE gsmid = '" + report.from + "'" )
      .on( 'row', function(row) {
        if ( monitorID || monitorID === 0 ) {
          console.log( "A monitor with this GSM number (id:" + monitorID + ") has already been found." );
          return;
        }
        monitorID = row.id;
      })
      .on( 'end', function() {
        if ( !monitorID && monitorID !== 0 ) {
          self.runAddMonitorQuery( report.from ).on( 'row', function(row) {
            if ( monitorID || monitorID === 0 ) {
              console.log( "A monitor with this GSM number (id:" + monitorID + ") has already been found." );
              return;
            }
            monitorID = row.id;
          } )
          .on( 'end', function() {
            if ( monitorID || monitorID === 0 ) {
              self.runStoreReportQuery( monitorID, report )
                .on( 'end', function(){console.log("DONE!");});
            } else {
              console.log( "No monitor with this gsmid found." );
            }
          });
        } else {
          self.runStoreReportQuery( monitorID, report )
            .on( 'end', function(){console.log("DONE!");});
        }
      });
  },
  storeMalformedReport: function( from, raw, timestamp ) {
    //TODO: Store the report somewhere anyway in case it was actually valid.
  },
  processSMS: function( from, body, timestamp ) {
    if ( !timestamp ) {
      timestamp = new Date();
    }
    var reportBytes = new Buffer( body, 'base64' );
    var report = parseReport( reportBytes );
    if ( !report ) {
      this.storeMalformedReport( from, body, timestamp );
      return false;
    }

    report.from = from;
    report.received = timestamp;
    report.raw = body;

    if ( report.isRegistration ) {
      this.processRegistration( report );
      return true;
    } else {
      this.storeReport( report );
      return true;
    }

    //if ( !momoDataStore.find( from ) ) {
      //TODO: Notify people that something happened
    //}
  }
};

function parseReport( reportBytes ) {
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
      console.log( "Invalid raw report length.");
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
    console.log( report );
    return report;
  } else {
    console.log( "Unrecognized MoMo report version " + report.version + ".");
    return;
  }
}
function getBatteryVoltage( rawValue ) {
  return rawValue / 1024 * 2.78 * 2;
}

module.exports = momoData;