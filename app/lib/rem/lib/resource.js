var path = require( 'path' );
var Modeler = require( './modeler')

var verbs = [ 'get', 'post', 'del', 'put' ]
var verbAliases = {
	'add': 'push',
	'remove': 'del',
	'update': 'put'
}

var Resource = function( name, model, engine ) {
	this.name = name;
	this.model = model;
	this.engine = engine;

	for ( var v in verbs )
		this[verbs[v]] = this.proxy.bind( this, verbs[v] );
	for ( var v in verbAliases )
		this[v] = this[verbAliases[v]];
}

Resource.prototype.serve = function( app, baseurl ) {
	var self = this;
	var serveFunc = function( fname, isCollection ) {
		var tryServe = function( f, isCollection, req, res ) {
			var params = self.engine.sanitizeParams( this, req.params );
		  var body = self.engine.sanitizeBody( this, req.method, req.body );
		  console.log( params );
		  console.log( body );

		  console.log( "Request received: " + req.path ) ;

		  try
			{
				f( params, body, function( err, responseData ) {
					if ( err )
					{
						var msg = "Oops, something bad happened!<br/>" + err;
						//self.options.logger.error( err );
						res.send(500, msg );
					}
					else
					{
						if ( responseData )
						{
							if ( responseData.length && !isCollection )
							{
								res.send( 200, responseData[0] );
							}
							else if ( responseData.length == 0 && req.method == 'GET' && !isCollection )
							{
								res.send( 404, "Resource not found." );
							}
							else if ( req.method == 'POST' )
							{
									res.send( 302, "Resource created." );
							}
							else
							{
								res.send( 200, responseData );
							}
						}
					}
				})
			}
			catch (e)
			{
				res.send(500, "Something bad happened: " + e.toString() );
			}
		}
		return tryServe.bind( self, self[fname].bind( self ), isCollection?true:false );
	}
	
	var url = path.join( baseurl, this.name );

	app.get( path.join( url, '_model' ), function( req, res ) {
		var model = Modeler.simplify( self.model );
		res.send( 200, model );
	});

	app.get( url          , serveFunc( 'get', true ) );
	app.get( url + "/:id" , serveFunc( 'get' ) );
	app.post( url         , serveFunc( 'post', true ) );
	app.put( url + "/:id" , serveFunc( 'put' ) );
	app.del( url + "/:id" , serveFunc( 'del' ) );
}

Resource.prototype.proxy = function( fname, params, body, output )
{
	switch ( arguments.length )
	{
		case 2:
			output = arguments[1];
			params = null;
			body = null;
			break;
		case 3:
			output = arguments[2];
			body = null;
			break;
		case 4:
			break;
		default:
			throw new Error( "Invalid arguments." );
	}
	if ( !params )
		this.engine.backend[fname]( this.model, this.name, null, body, output );
	else if ( typeof params == 'object' )
		this.engine.backend[fname]( this.model, this.name, params, body, output )
	else
		this.engine.backend[fname]( this.model, this.name, { id: params }, body, output );
}

module.exports = Resource;