var express = require( 'express' ),
    fs = require( 'fs' );

var templateServer = function( app ) {
  this.app = app;
};
templateServer.prototype = {
  serve: function( path, templateDir ) {
    this.app.get( path + '.json', function( req, res ) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write( JSON.stringify( getAllTemplates( templateDir ) ) );
      res.end();
    });
  }
};

function getAllTemplates( templateDir ) {
  var fileNames = fs.readdirSync( templateDir ),
      templates = {},
      i;
  for ( i=0; i<fileNames.length; ++i ) {
    var templateName = fileNames[i].substring( 0, fileNames[i].length - 5 ),
        template = fs.readFileSync( templateDir + "/" + fileNames[i], "utf8" );
    if ( template && template.length > 0 ) {
      templates[templateName] = template;
    }
  }
  return templates;
}

module.exports = templateServer;