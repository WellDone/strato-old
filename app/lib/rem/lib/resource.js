var path = require( 'path' );
var Modeler = require( './modeler')

var verbs = [ 'get', 'post', 'del', 'put' ]
var verbAliases = {
	'add': 'post',
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

function handleBackendResult( req, res, isCollection, err, responseData ) {
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
}

Resource.prototype.serve = function( app, baseurl ) {
	var self = this;
	var serveFunc = function( fname, isCollection ) {
		var tryServe = function( f, isCollection, req, res ) {
		  try
			{
				f( req.params, req.body, handleBackendResult.bind(null, req, res, isCollection) );
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
	for ( var c in self.model.columns )
	{
		if ( self.model.columns[c].ref ) {
			var isCollection = self.model.columns[c].ref.plural;
			app.get( url + "/:id/" + c, function( c, req, res ) {
				var params = { where: {} };
				params.where[self.model.columns[c].ref.complement] = req.params.id;
				var target = self.model.columns[c].ref.target.name;
				console.log( target );
				self.engine.resource(target).get( params, handleBackendResult.bind( null, req, res, isCollection ) );
			}.bind( self, c ) );
		}
	}
}

Resource.prototype.proxy = function( fname, params, body, output )
{
	console.log( arguments );
	switch ( arguments.length )
	{
		case 2:
			output = arguments[1];
			params = null;
			body = null;
			break;
		case 3:
			output = arguments[2];
			if ( fname == 'post' )
			{
				body = arguments[1];
				params = null;
			}
			else
			{
				body = null;
				params = arguments[1];
			}
			break;
		case 4:
			break;
		default:
			throw new Error( "Invalid arguments." );
	}
	try
	{
		console.log( fname, params, body, output );
		params = this.engine.sanitizeParams( this, params );
		body = this.engine.sanitizeBody( this, fname, body )
		if ( !params )
			this.engine.backend[fname]( this.model, this.name, null, body, output );
		else if ( typeof params == 'object' )
			this.engine.backend[fname]( this.model, this.name, params, body, output )
		else
			this.engine.backend[fname]( this.model, this.name, { id: params }, body, output );
	}
	catch (e)
	{
		output( e );
	}
}

module.exports = Resource;