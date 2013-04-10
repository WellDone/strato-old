var express = require( 'express' ),
    dbEngine = require( './db.js' ),
    fs = require( 'fs' ), //TEMPORARY
    util = require( 'util' );

var MAX_REPORTS = 25;
var reports = [];

var dataServer = function( app, db ) {
  this.app = app;
  this.db = db;
};
dataServer.prototype = {
  serve: function( path ) {
    var self = this;
    this.app.get( path + '/sites.json', function( req, res ) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      self.getAllSites( res );
    } );
    this.app.get( path + '/sites/:site/reports.json', function( req, res ) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      self.getReports( res, req.params.site )
    } );

    this.app.put( path + '/sites/:site/reports', function( req, res ) {
      if ( !req.body.date ) { req.body.date = formatDate( new Data() ); }
      self.db.query({ text: "INSERT INTO reports ( date, volume, monitorid ) VALUES ($1,$2,$3)",
                      values: [req.body.date, req.body.volume, req.body.monitorid ] })
        .on( 'error', function( err ) {
          console.log(err);
        });
      res.writeHead( 200 );
      res.write( "Sent." );
      res.end();
    });

    this.app.post( '/sms', function( req, res ) {
      console.log( "Received SMS report" );

      if ( req.body.Body && req.body.From ) {
        if ( self.processSMS( req.body.From, req.body.Body ) ) {
          res.writeHead( 200 );
          console.log( "Successfully processed report." );
          res.end();
          return;
        }
      }

      res.writeHead( 400 );
      res.write( "Malformed request." );
      console.log( "Malformed request." );
      res.end();
    });

    this.app.post( '/sms/sync', function( req, res ) {
      console.log( "Received SMS report from SMSSync gateway." );

      if ( req.body.from && req.body.message ) {
        if ( self.processSMS( req.body.from, req.body.message ) ) {
          res.writeHead( 200 );
          res.write( "{payload:{success:\"true\"}}" );
          console.log( "Successfully processed report." );
          res.end();
          return;
        }
      }

      res.writeHead( 400 );
      res.write( "Malformed request." );
      console.log( "Malformed request." );
      res.end();
    })

    this.app.get( '/reports', function( req, res ) {
      res.writeHead( 200 );
      for ( var i=0; i<reports.length; ++i ) {
        res.write( util.inspect( reports[i] ) );
        res.write( "\n\n" );
      }
      res.end();
    })

    //startSocketIO( app );
  },
  //TODO: These functions can be sped up significantly if we keep the
  //  site definitions and site-monitor mappings in memory.
  getAllSites: function(res) {
    var db = this.db,
        query = this.db.query("SELECT * FROM sites"),
        sites = [],
        queryCount = 1;
    query.on( 'row', function( row ) {
      var site = { id: row.id,
                   name: row.name,
                   country: row.country,
                   monitors: []
                  };
      sites.push( site );
      var subQuery = db.query( "SELECT * FROM monitors WHERE siteid=" + row.id );
      ++queryCount;
      subQuery.on( 'row', function( row ) {
        var monitor = { id: row.id,
                        name: row.name,
                        loc: parsePoint( row.location ) };
        site.monitors.push( monitor );
      }).on( 'end', function() {
        --queryCount;
        if ( queryCount === 0 ) { res.write( JSON.stringify( sites ) ); res.end(); }
      })
    }).on( 'end', function() {
      --queryCount;
      if ( queryCount === 0 ) { res.write( JSON.stringify( sites ) ); res.end(); }
    });
  },
  getReports: function(res, siteID) {
    var reports = {};
    this.db.query( "SELECT reports.date, reports.volume, reports.monitorid FROM reports INNER JOIN monitors ON monitors.id = reports.monitorid WHERE monitors.siteid = " + siteID )
      .on( 'row', function(row) {
        row.date = formatDate( row.date );
        if (!reports[row.date]) { reports[row.date] = {} };
        reports[row.date][row.monitorid] = row.volume;
      })
      .on( 'end', function() {
        var reportArray = [];
        for ( var key in reports ) {
          reports[key].date = key;
          reportArray.push( reports[key] );
        }
        res.write( JSON.stringify( reportArray ) );
        res.end();
      });
  },
  parseReport: function( reportValue ) {
    var report = {};
    report.version = reportValue[0];
    if ( report.version & 0x80 ) {
      // Registration
      report.isRegistration = true;
      report.version &= 0x7F; //Mask out the high registration marker bit.
      if ( report.version == 0 ) {
        report.errorCount = reportValue[1];
        return report;
      } else {
        console.log( "Unrecognized registration version." );
        return;
      }
    }
    else if ( report.version == 1 ) //TODO: Make extensible
    {
      if ( reportValue.length != 104 ) {
        console.log( "Invalid raw report length.");
        return;
      }
      report.currentHour = reportValue[1]
      report.batteryVoltage = getBatteryVoltage( reportValue.readUInt16LE(2) );
      report.hourCount = reportValue[4];
      report.eventCount = reportValue[5]
      report.sensorType = reportValue[6];
      var __unused = reportValue[7]
      var bucketString = reportValue.slice(8);
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
  },
  processSMS: function( from, body ) {
    var reportBytes = new Buffer( body, 'base64' );
    console.log( body );
    if (!reportBytes)
      return false;

    var report = this.parseReport( reportBytes );
    if ( !report )
      return false;

    var meta = {
      received: new Date(),
      from: from,
      raw: body,
      type: (report.isRegistration)?"registration":"report",
      report: report
    };
    reports.push( meta );
    if ( reports.length > MAX_REPORTS ) {
      reports.shift();
    }
    return true;
  }
}

//TODO: Robustify!  Or maybe use a different datatype...
//      The 'pg' module is extensible, should be able to tie into their system.
var parsePoint = function( pt ) {
  if ( pt[0] !== "(" || pt[pt.length-1] !== ")" || pt.indexOf( "," ) === -1 ) { return null; }
  var lat = JSON.parse( pt.substring( 1, pt.indexOf( "," ) ) );
  var lng = JSON.parse( pt.substring( pt.indexOf( "," )+1, pt.length-2 ) );
  return { lat: lat, lng: lng };
}

function startSocketIO( app ) {
  var server = require('http').createServer(app),
      io = require('socket.io').listen(server);

  //TODO: Placeholder, replace with something real
  io.sockets.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
      logger.log(data);
    });
  });
}

function formatDate( date ) {
  var y = String(date.getFullYear());
  var m = String(date.getMonth() + 1);
  if ( m.length < 2 ) {
    m = "0" + m;
  }
  var d = String(date.getDate()+1);
  if ( d.length < 2 ) {
    d = "0" + d;
  }
  return y + m + d;
}

function getBatteryVoltage( rawValue ) {
  return rawValue / 1024 * 2.78 * 2;
}

module.exports = dataServer;