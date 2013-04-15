var util = require( 'util' );

var dataServer = function( app, data ) {
  this.app = app;
  this.data = data;
  this.db = data.db;
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

    this.app.get( '/sites/:site/reports', function( req, res ) {
      res.writeHead( 200 );

      res.end();
    })

    //startSocketIO( app );
  },
  listen: function( path ) {
    var self = this;
    function processSMSPost( req, res ) {
      console.log( "Received SMS report" );

      var body = req.body.Body? req.body.Body : req.body.message;
      var from = req.body.From? req.body.From : req.body.from;
      var timestamp = req.body.sent_timestamp? new Date(req.body.sent_timestamp*1000) : null;

      if ( body && from ) {
        if ( self.data.processSMS( from, body, timestamp ) ) {
          res.writeHead( 200 );
          if (req.body.message) // This came from SMSSync
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
    }

    this.app.post( path, processSMSPost );
    this.app.post( path + '/sync', processSMSPost );
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
    this.db.query( "SELECT aggregate_reports.date, aggregate_reports.eventcount, aggregate_reports.monitorid FROM aggregate_reports INNER JOIN monitors ON monitors.id = aggregate_reports.monitorid WHERE monitors.siteid = " + siteID )
      .on( 'row', function(row) {
        row.date = formatDate( row.date );
        if (!reports[row.date]) { reports[row.date] = {} };
        reports[row.date][row.monitorid] = row.eventcount;
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



module.exports = dataServer;