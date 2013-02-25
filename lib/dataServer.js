var express = require( 'express' ),
    dbEngine = require( './db.js' ),
    fs = require( 'fs' ); //TEMPORARY

var dataServer = function( app, db ) {
  this.app = app;
  this.db = db;
};
dataServer.prototype = {
  serve: function( path ) {
    var self = this;
    this.app.get( path + '/sites.json', function( req, res ) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write( self.getAllSites() );
      res.end();
    } )
    //startSocketIO( app );
  },
  getAllSites: function() {
    return fs.readFileSync( './resources/dummy_sites.json', 'utf8' );
  }
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

module.exports = dataServer;