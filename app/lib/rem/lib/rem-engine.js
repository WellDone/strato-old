var path = require( 'path' );

var REM = require( './rem.js' );
var Modeler = require( './modeler.js' );
var REMResource = require( './resource.js' );
var _ = require( 'lodash' );
var Authenticator = require( './authentication' );

var verbs = [ 'get', 'post', 'del', 'put' ]
var verbAliases = {
	'add': 'post',
	'remove': 'del',
	'update': 'put'
}

function REMEngine( version, modelJSON, backend, options ) {
	this.options = options;
	this.version = version;

	this.auth = new Authenticator( this, this.options.jwtSecret );

	this.backend = backend;
	this.model = Modeler.create( modelJSON );

	this.resources = {};
	for ( var r in this.model.top )
	{
		this.resources[r] = new REMResource( r, this.model.top[r], this );
	}

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

REMEngine.prototype.authenticate = function( login, cb ) {
	var q = _.pick( login, this.model.auth.login );
	if ( !q || !q[this.model.auth.login] )
		return cb( "Invalid login field." );

	login = q[this.model.auth.login];
	this.resources[this.model.auth.resource].get( {
		where: q,
		withSensitive: true
	}, function( err, users ) {
		if ( err || !users || users.length != 1 ) {
			return cb( "User not found.", null );
		}
		else {
			var user = users[0];
			return cb( null, {
				identity: {
					id: login,
					user: _.omit( user, function( value, key ) {
							return ( key[0] == '_' );
						} ),
					roles: (login=="austin@welldone.org")?["master"]:["layman"]
				},
				encryptedPassword: user._encrypted_password,
				passwordSalt: user._password_salt
			} );
		}
	}.bind( this ) );
}
REMEngine.prototype.authorize = function( resource, user, method, cb ) {
	return cb( null, [] );
}

REMEngine.prototype.serve = function( app, baseurl ) {
	var self = this;
	app.get( path.join( baseurl, '_version' ), function( req, res ) {
		res.send( 200, self.version.join('.') );
	});
	app.get( path.join( baseurl, '_types' ), function( req, res ) {
		res.send( 200, self.model.types );
	});
	app.get( path.join( baseurl, '_model' ), function( req, res ) {
		var model = Modeler.simplify( self.model );
		res.send( 200, model );
	});
	if ( this.backend.schema )
		app.get( path.join( baseurl, '_schema' ), function( req, res ) {
			res.set('Content-Type', 'text/plain');
			res.send( 200, self.schemaString() );
		});

	for ( var i in this.resources )
	{
		this.resources[i].serve( app, baseurl );
	}
}
REMEngine.prototype.resource = function( name ) {
	return this.resources[name];
}
REMEngine.prototype.r = REMEngine.prototype.resource;

REMEngine.prototype.sanitizeParams = function( resource, params ) {
	var out = {
		fields: [],
		where: {},
		limit: 0,
		order: null
	};

	if ( !params )
		return out;

	if ( params.fields )
	{
		params.fields.forEach( function( f ) {
			if ( !resource.model.columns.hasOwnProperty( f )
				|| resource.model.columns[f].ref 
				|| ( !params.withSensitive && f[0] == '_' ) )
				throw new Error( "Resource type '" + resource.name + "' has no local property '" + f + "'" );
			out.fields.push( f );
		});
	}
	if ( out.fields.length === 0 ) {
		for ( var c in resource.model.columns )
		{
			if ( !resource.model.columns[c].ref
				&& ( params.withSensitive || c[0] != '_' ) )
				out.fields.push( c );
		}
	}

	for ( var w in params.where )
	{
		out.where[w] = params.where[w];
	}

	if ( params.id )
		out.where[resource.model.id] = params.id;

	if ( params.order )
	{
		var flipped = false;
		if ( params.order[0] == '-' )
			flipped = true;

		var column = (flipped)? params.order.substr( 1, params.order.length - 1 ) : params.order;
		if ( !resource.model.columns.hasOwnProperty( column ) || resource.model.columns[column].ref )
				throw new Error( "Resource type '" + resource.name + "' has no local property '" + column + "'" );

		out.order = {
			column: column,
			direction: flipped? 'descending' : 'ascending'
		}
	}
	
	return out;
}

REMEngine.prototype.schema = function() {
	return this.backend.schema( this.model );
}

REMEngine.prototype.schemaString = function() {
	return this.backend.schemaString( this.model );
}

REMEngine.prototype.sanitizeBody = function( resource, method, body )
{
	for ( var f in body )
		if ( !resource.model.columns.hasOwnProperty( f ) )
			throw new Error( "Unrecognized column '" + f + "' for type '" + resource.name + "'." );
	for ( var c in resource.model.columns )
		if ( method.toLowerCase() == 'post' && resource.model.columns[c].constraints.required && !body[c] && body[c] !== 0 )
			throw new Error( "Property '" + c + "' is required for type '" + resource.name + "'" );
	return body;
}

module.exports = REMEngine;