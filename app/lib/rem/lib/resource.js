var path = require( 'path' );
var _ = require( 'lodash' );
var Modeler = require( './modeler')
var auth = require( './authentication' );
var crypto = require( 'crypto' );

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
				var params = {};
				for ( p in req.params )
					params[p] = req.params[p];
				for ( p in req.query )
					params[p] = req.query[p]; // shallow

				params.withSensitive = false;
				var body = _.omit( req.body, function( value, key ) {
					return ( key[0] == '_' );
				})
				f( params, body, handleBackendResult.bind(null, req, res, isCollection) );
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
				for ( p in req.query )
					params[p] = req.query[p]; // shallow

				params.withSensitive = false;
				
				params.where[self.model.columns[c].ref.complement] = req.params.id;
				var target = self.model.columns[c].ref.target.name;
				self.engine.resource(target).get( params, handleBackendResult.bind( null, req, res, isCollection ) );
			}.bind( self, c ) );
		}
	}

	//TODO: move to authentication.js
	if ( this.name == this.engine.model.auth.resource )
	{
		app.post( url + "/:id/password", function( req, res ) {
			if ( !req.identity || req.identity.user.id != req.params['id'] )
			{
				res.send( 403, "You may only change your own password." );
				return;
			}
			else
			{
				if ( !req.body.new_password || !req.body.old_password )
				{
					res.send( 400, "No password specified." );
					return;
				}

				this.engine.auth.authenticatePassword( req.identity.user, req.body.old_password, function( err, token ) {
					if ( err || !token ) {
						console.log( err );
						return res.send( 403, "Invalid password." );
					}
					auth.encryptPassword( req.body.new_password, {}, function( err, encryptedPassword, salt ) {
						if ( err )
						{
							return res.send( 500, "Failed to encrypt password." );
						}
						var q = { where: {
								'id': req.params['id']
							}
						} ;
						this.update( q, {
							_encrypted_password: encryptedPassword,
							_password_salt: salt
						}, function( err, result ) {
							if ( err )
							{
								console.log( err );
								return res.send( 500, "Failed to update password." );
							}
							return res.send( 200, "Successfully updated password." );
						});
					}.bind( this ) );
				}.bind( this ) );
			}
		}.bind( this ) )
		app.del( url + "/:id/password", function( req, res ) {
			if ( !req.identity || !_.contains( req.identity.roles, 'master' ) )
			{
				return res.send( 403, "You are not authorized to perform this action." );
			}
			var new_password = crypto.randomBytes(12).toString('base64');
			auth.encryptPassword( new_password, {}, function( err, encryptedPassword, salt ) {
				if ( err )
				{
					return res.send( 500, "Failed to encrypt password." );
				}
				var q = { where: {
					'id': req.params['id']
				} };
				this.update( q, {
					_encrypted_password: encryptedPassword,
					_password_salt: salt
				}, function( err, result ) {
					if ( err )
					{
						console.log( err );
						return res.send( 500, "Failed to update password." );
					}
					console.log( "Password set to : " + new_password );
					return res.send( 200, "Successfully updated password." );
				});
			}.bind( this ) );
		}.bind( this ) )
	}
}

function stripSensitiveInfo( output, err, res )
{
	if ( err ) {
		output( err );
	}
	else
	{
		if ( _.isArray( res ) )
		{
			res = _.map(res, function( o ) {
				return _.omit( o, function( value, key ) {
					return key[0] == '_';
				} );
			} );
		}
		else
		{
			res = _.omit( res, function( value, key ) {
				return key[0] == '_';
			} );
		}
		output( null, res );
	}
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

	if ( !params || !params.withSensitive )
		output = stripSensitiveInfo.bind( this, output );
	try
	{
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