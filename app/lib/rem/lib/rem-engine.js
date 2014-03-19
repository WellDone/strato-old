var path = require( 'path' );
var express = require( 'express' );

var verbs = [ 'get', 'post', 'del', 'put' ]
var verbAliases = {
	'add': 'push',
	'remove': 'del',
	'update': 'put'
}

var REM = require( './rem.js' );

function REMEngine( version, schemaString, backend, options ) {
	this.options = options;
	this.version = version;
	this.resources = [];
	this.aliases = {};

	this.parseSchema( schemaString );

	this.backend = backend;

	for ( var i in verbs )
	{
		var v = verbs[i];
		if ( !this[v] )
		{
			this[v] = function( v, name ) {
				var r = this.r(name);
				if ( !r )
					throw new Error( "Resource '" + name + "' does not exist." );
				return r[v].apply( r, Array.prototype.slice.call( arguments, 2 ) );
			}.bind( this, v )
		}
	}
}

REMEngine.createName = function( nameString )
{
	var splitName = nameString.split( "/" );
	return {
		singular: splitName[0],
		plural: (splitName.length == 1)? splitName[0] : splitName[1]
	}
}
REMEngine.prototype.validateColumnType = function( type )
{

}
REMEngine.prototype.parseColumnType = function( typeString )
{
	if ( typeString.substr( 0, 4 ) == 'ref:' )
	{

	}
	else if ( typeString.substr( 0, 7 ) == 'refset:' )
	{

	}
	else
	{
		this.validateColumnType( typeString );
		return typeString;
	}
}
REMEngine.prototype.parseColumnDescription = function( description )
{
	if ( typeof description != 'string' )
		throw new Error( "Column definitions must be specified as a string." );
	var split = description.split( '|' );
	var type = this.parseColumnType( split[0].trim() );
	var constraints = {};
	if ( split.length == 2 )
	{
		split = split[1].split( "," );
		for ( var i = 0; i < split.length; ++i )
		{
			var c = split[i].trim();
		  if ( c.substr( 0, 5 ) == "size:" )
		  {
		  	constraints['size'] = {};
		  	var bounds = c.substr( 5 ).split("-");
		  	if ( bounds.length == 1 )
		  	{
		  		constraints['size']['max'] = parseInt( bounds[0].trim() );
		  	}
		  	else if ( bounds.length == 2 )
		  	{
		  		constraints['size']['min'] = parseInt( bounds[0].trim() );
		  		constraints['size']['max'] = parseInt( bounds[1].trim() );
		  	} else {
		  		throw new Error( "Invalid constraint specifier '" + description + "'." );
		  	}

		  	if ( isNaN( constraints['size']['max'] ) ||
		  	     ( constraints['size'].hasOwnProperty('min') && isNaN( constraints['size']['min'] ) ) )
		  		throw new Error( "Invalid constraint specifier '" + description + "'.  Size bounds must be integers." );
		  }
		  else
		  {
		  	switch ( c )
		  	{
		  		case 'pkey':
		  		case 'primary_key':
		  			constraints.pkey = true;
		  			break;
		  		case 'unique':
		  			constraints.unique = true;
		  			break;
		  		case 'required':
		  		case 'notnull':
		  			constraints.required = true;
		  			break;
		  		default:
		  			throw new Error( "Invalid constraint specifier '" + description + "'.  Unrecognized constraint '" + c + "'." );
		  	}
		  }
		}
	}
	return {
		type: type,
		constraints: constraints
	};
}
REMEngine.prototype.parseSchema = function( schemaString )
{
	this.schema = JSON.parse( schemaString );
	
	var types = {};
	for ( var r in this.schema.types )
	{
		var name = REMEngine.createName(r);
		types[name.singular] = {
			columns: this.schema.types[r]
		}
		//types[name.plural] = types[name.singular];
		var t = types[name.singular];
		t.id = null;
		for ( var c in t.columns )
		{
			t.columns[c] = this.parseColumnDescription( t.columns[c] );
			if ( t.columns[c].constraints.pkey )
			{
				if ( t.id != null )
					throw new Error( "REM supports only single-column primary key constraints." );
				t.id = c;
			}
		}
		if ( t.id == null )
			throw new Error( "No primary key constraint specified for type '" + name.singular + "'." );

		var resource = new REMEngine.Resource( name, t, this );
		this.resources.push( resource );
		this.aliases[name.singular] = resource;
		this.aliases[name.plural] = resource;
	}
	this.schema.types = types;
}
REMEngine.prototype.serve = function( app, baseurl ) {
	app.use( baseurl, express.json() );
	app.use( baseurl, express.urlencoded() );
	//app.use( baseurl, express.timeout( 5000 ) );

	var version = this.version;
	app.get( path.join( baseurl, 'version' ), function( req, res ) {
		res.send( 200, version.join('.') );
	});
	var schema = this.schema;
	app.get( path.join( baseurl, 'schema' ), function( req, res ) {
		res.send( 200, schema );
	});

	for ( var i = 0; i < this.resources.length; ++i )
	{
		this.resources[i].serve( app, baseurl );
	}
}
REMEngine.prototype.resource = function( name ) {
	return this.aliases[name];
}
REMEngine.prototype.r = REMEngine.prototype.resource;

REMEngine.prototype.sanitizeParams = function( resource, params ) {
	var filters = {};
	for ( var f in params )
	{
		var value = params[f];
		if ( f == 'id' )
			f = resource.schema.id;

		if ( !resource.schema.columns.hasOwnProperty( f ) )
			throw new Error( "Resource type '" + resource + "' has no property '" + f + "'" );

		filters[f] = value;
	}
	//TODO: nesting.
	return filters;
}

REMEngine.prototype.sanitizeBody = function( resource, method, body )
{
	for ( var f in body )
		if ( !resource.schema.columns.hasOwnProperty( f ) )
			throw new Error( "Unrecognized column '" + f + "' for type '" + resource.name.singular + "'." );
	for ( var c in resource.schema.columns )
		if ( method == 'POST' && resource.schema.columns[c].constraints.required && !body[c] )
			throw new Error( "Property '" + c + "' is required for type '" + resource.name.singular + "'" );
	return body;
}

REMEngine.Resource = function( name, schema, engine ) {
	this.name = name;
	this.schema = schema;
	this.engine = engine;

	for ( var v in verbs )
		this[verbs[v]] = this.proxy.bind( this, verbs[v] );
	for ( var v in verbAliases )
		this[v] = this[verbAliases[v]];
}

REMEngine.Resource.prototype.serve = function( app, baseurl ) {
	var self = this;
	var serveFunc = function( fname ) {
		var tryServe = function( f, req, res ) {
			var params = self.engine.sanitizeParams( this, req.params );
		  var body = self.engine.sanitizeBody( this, req.method, req.body );

		  try
			{
				f( params, body, function( err, responseData ) {
					if ( err )
					{
						var msg = "Oops, something bad happened!<br/>" + err;
						self.options.logger.error( err );
						res.send(500, msg );
					}
					else
					{
						if ( responseData )
						{
							if ( responseData.length && responseData.length == 1 )
							{
								res.send( 200, responseData[0] );
							}
							else if ( responseData.length == 0 )
							{
								if ( req.method == 'GET' )
									res.send( 404, "Resource not found." );
								else
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
		return tryServe.bind( self, self[fname].bind( self ) );
	}
	
	var pluralURL = path.join( baseurl, this.name.plural );

	app.get( pluralURL          , serveFunc( 'get' ) );
	app.get( pluralURL + "/:id" , serveFunc( 'get' ) );
	app.post( pluralURL         , serveFunc( 'post' ) );
	app.put( pluralURL + "/:id" , serveFunc( 'put' ) );
	app.del( pluralURL + "/:id" , serveFunc( 'del' ) );
}

REMEngine.Resource.prototype.proxy = function( fname, params, body, output )
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
		this.engine.backend[fname]( this.schema, this.name.plural, null, body, output );
	else if ( typeof params == 'object' )
		this.engine.backend[fname]( this.schema, this.name.plural, params, body, output )
	else
		this.engine.backend[fname]( this.schema, this.name.plural, { id: params }, body, output );
}

module.exports = REMEngine;