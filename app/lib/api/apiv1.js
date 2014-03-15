var server = function( app, config, db ) {
	this.app = app;
	this.config = config;
	this.db = db;
}
server.prototype = {
	
	serve: function( basePath ) {
		this.app.get( basePath + '/sites', function( req, res ) {
			res.writeHead(200, { 'Content-Type': 'application/json' } );
			
		}
		this.app.delete( basePath + '/sites/:siteid', function( req, res ) {
			res.writeHead(200);
			this.db.core.query( "DELETE FROM sites WHERE id=" + req.siteid )
				.on( 'row', function(row) {

				})
		}
	}
}

module.exports = server;

var parsePoint = function( pt ) {
  if ( pt[0] !== "(" || pt[pt.length-1] !== ")" || pt.indexOf( "," ) === -1 ) { return null; }
  var lat = JSON.parse( pt.substring( 1, pt.indexOf( "," ) ) );
  var lng = JSON.parse( pt.substring( pt.indexOf( "," )+1, pt.length-2 ) );
  return { lat: lat, lng: lng };
}