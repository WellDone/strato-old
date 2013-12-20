var express = require( 'express' ),
    stylus = require( 'stylus' ),
    nib = require( 'nib' );

function compileCSS(str, path) {
  return stylus(str)
    .set('filename', path)
    .set('compress', false)
    .use( nib() );
}

var resourceServer = function( app ) {
  this.app = app;
};
resourceServer.prototype = {
  serve: function( path, dir, cssDir ) {
    this.app.use( stylus.middleware({
      src: cssDir,
      dest: "/home/application/csscache",
      debug: true,
      compile: compileCSS
    }));

    this.app.use( path, express.static( dir ) );
  }
};

module.exports = resourceServer;