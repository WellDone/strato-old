var util = require( 'util' ),
    events = require('events'),
    serverEmitter = new events.EventEmitter();

var dataServer = function( app, data ) {
  this.app = app;
  this.data = data;
  this.db = data.db;
};
dataServer.prototype = {
  serve: function( path, io ) {
    var self = this;
    this.app.get( path + '/sites.json', function( req, res ) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      self.getAllSites( res );
    } );
    this.app.get( path + '/sites/:site/reports.json', function( req, res ) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      self.getReports( res, req.params.site )
    } );

    this.app.get( '/sites/:site/reports', function( req, res ) {
      res.writeHead( 200 );

      res.end();
    })

    startSocketIO( io );
  },
  listen: function( path ) {
    var self = this;
    function processSMSPost( req, res ) {
      console.log( "Received SMS report" );

      var body = req.body.Body? req.body.Body : req.body.message;
      var from = req.body.From? req.body.From : req.body.from;
      var timestamp = req.body.sent_timestamp;
      if (timestamp) {
        timestamp = parseInt(timestamp)
        if ( !isNaN(timestamp) ) {
          timestamp = new Date(timestamp);
        } else {
          console.log( "Discarding invalid timestamp " + req.body.sent_timestamp );
          timestamp = null;
        }
      }

      console.log( req.body );

      if ( body && from ) {
        if ( self.data.processSMS( from, body, timestamp, serverEmitter ) ) {
          res.writeHead( 200 );
          if (req.body.message) // This came from SMSSync
          {
            res.write( "{payload:{success:\"true\"}}" );
          }
          console.log( "Successfully processed report." );
          res.end();
          return;
        }
      }

      res.writeHead( 400 );
      res.write( "Malformed request." );
      console.log( "Malformed request." );
      res.end();
    }

    this.app.post( path, processSMSPost );
    this.app.post( path + '/sync', processSMSPost );
  },
  //TODO: These functions can be sped up significantly if we keep the
  //  site definitions and site-monitor mappings in memory.
  getAllSites: function(res) {
    var db = this.db,
        query = this.db.queries.core.collections.getAll(),
        sites = [],
        queryCount = 1;
    query.on( 'row', function( row ) {
      var site = { id: row.id,
                   name: row.name,
                   country: row.country,
                   monitors: [],
                   population: Math.ceil( Math.random() * 15 + 30 )
                  };
      sites.push( site );
      var subQuery = db.core.query( "SELECT * FROM monitors WHERE siteid=" + row.id );
      ++queryCount;
      subQuery.on( 'row', function( row ) {
        var monitor = { id: row.id,
                        name: row.name,
                        loc: parsePoint( row.location ),
                        gsmid: row.gsmid };
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
    var counts = {};
    this.db.core.query( "SELECT aggregate_reports.timestamp, aggregate_reports.eventcount, aggregate_reports.monitorid FROM aggregate_reports INNER JOIN monitors ON monitors.id = aggregate_reports.monitorid WHERE monitors.siteid = " + siteID )
      .on( 'row', function(row) {
        row.date = row.timestamp;
        if (!reports[row.date]) { reports[row.date] = {}; counts[row.date] = 0; };
        reports[row.date][counts[row.date]++] = row.eventcount;
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

function startSocketIO( io ) {
  io.sockets.on('connection', function (socket) {
    var reportCallback = function(data) {
      socket.emit('newReport', data);
    }
    socket.on( 'watch monitor', function(monitorid) {
      socket.get( 'monitors', function( err, monitors ) {
        if ( err || !monitors )
          monitors = [];
        monitors.push( monitorid );
        serverEmitter.on('monitor/' + monitorid + '/newReport', reportCallback );
        socket.set( 'monitors', monitors, function() {
          console.log( "Socket is watching monitor " + monitorid );
        })
      })
    });
    socket.on( 'clear monitors', function() {
      socket.get( 'monitors', function( err, monitors ) {
        if ( err || !monitors )
          return;
        for (monitorid in monitors) {
          serverEmitter.removeListener( 'monitor/' + monitorid + '/newReport', reportCallback );
        }
        socket.set( 'monitors', [], function() {
          console.log( "Cleared socket monitor watch-list " + monitorid );
        })
      })
    } );
  });
}

function formatDate( date ) {
  var y = String(date.getFullYear());
  var m = String(date.getMonth() + 1);
  if ( m.length < 2 ) {
    m = "0" + m;
  }
  var d = String(date.getDate());
  if ( d.length < 2 ) {
    d = "0" + d;
  }
  return y + m + d;
}



module.exports = dataServer;