var uuid = require( 'node-uuid' )
var jwt = require( 'jwt-simple' )
var crypto = require( 'crypto' )
var _ = require( 'lodash' )
var moment = require( 'moment' )

var jwtSecret = "3e387369-1e29-4adf-863c-e7a33632c3c0"

var defaultIterations = 10000
var keyLength = 64

var tokenLifetimeHours = 1;

function getExpirationTime( base ) {
	base = moment( base );
	return base.add( 'hours', tokenLifetimeHours ).valueOf();
}

var Authenticator = function( authProxy ) {
	if ( !authProxy 
		|| !authProxy.findUser 
		|| !authProxy.getEncryptedPassword 
		|| !authProxy.getPasswordSalt 
		|| !authProxy.getAllRoles )
		throw new Error( "Rubbish, we can't authenticate with this!" )

	this.proxy = authProxy;
}
Authenticator.prototype.encryptPassword = function( plaintextPassword, options, cb ) {
	if ( !plaintextPassword || plaintextPassword.length < 6 )
		return cb( "Password does not meet the complexity requirements" );
	options = options || {};
	options.salt = options.salt || crypto.randomBytes(64);
	options.iterations = options.iterations || defaultIterations;

	crypto.pbkdf2( plaintextPassword, options.salt, options.iterations, keyLength, function( err, key ) {
		if ( err )
			return cb( err );
		return cb( null, key.toString( 'base64' ) );
	} );
}
Authenticator.prototype.authenticatePassword = function( identity, authData, plaintextPassword, cb ) {
	if ( !identity || !authData.encryptedPassword )
		return cb( "Invalid authentication function parameters." )

	this.encryptPassword( plaintextPassword, authData, function( err, key ) {
		if ( key !== authData.encryptedPassword )
			return cb( "Invalid password." );
		try
		{
			var now = new Date();
			var payload = {
				id: identity,
				iat: now.valueOf(),
				exp: getExpirationTime( now )
			}
			var token = jwt.encode( payload, jwtSecret );
			return cb( null, token, payload );
		}
		catch (e)
		{
			return cb( e );
		}
	})
}

Authenticator.prototype.authenticateToken = function( token, cb ) {
	try
	{
		var payload = jwt.decode( token, jwtSecret );
		if ( !payload.iat && !payload.exp )
			return cb( "Invalid token." )
		if ( payload.exp && payload.exp <= new Date()
			|| payload.iat && getExpirationTime( payload.iat ) <= new Date() )
			return cb( "Expired token." )
		console.log( payload );
		console.log( (new Date()).getTime() );
		return cb( null, payload.id );
	}
	catch (e)
	{
		return cb( e );
	}
}

Authenticator.prototype.login = function() {
	return function( req, res, next ) {
		if ( !req.body || !req.body.user || !req.body.password )
		{
			res.send( 401, "Invalid login attempt." );
			return;
		}
		else
		{
			var identity = this.proxy.findUser( req.body.user );
			if ( !identity )
			{
				console.log( "Authenticator error: user '" + req.body.user + "' does not exist." )
				res.send( 401, "Invalid username or password." )
				return;
			}

			var opts = {
				encryptedPassword: this.proxy.getEncryptedPassword( req.body.user ),
				salt: this.proxy.getPasswordSalt( req.body.user )
			}
			this.authenticatePassword( identity, opts, req.body.password, function( err, token, payload ) {
				if ( err || !token )
				{
					console.log( "Authenticator error: " + err )
					res.send( 401, "Invalid username or password." )
					return;
				}
				else
				{
					var out = {
						token: token,
						data: payload
					}
					res.send( 200, out );
				}
			} )
		}
	}.bind( this );
}

Authenticator.prototype.authorize = function( req, res, next ) {
	if ( !req.identity )
	{
		//TODO: anonymous
		res.set( "WWW-Authenticate", "Bearer")
		res.send( 401, "Authentication failed." );
		return;
	}

	var rolePermissions = this.proxy.getAllRoles()
	var authorized = false;
	console.log( "method: " + req.method )
	this.checkPermissions( rolePermissions, req.identity.roles, req.method, function(err) {
		if ( !err )
			authorized = true;
	})
	
	if ( !authorized )
	{
		res.send( 403, "Unauthorized!" );
		return;
	}
	
	console.log( "Authorized for '" + req.method + "'" );
	next()
};

Authenticator.prototype.middleware = function() {
	return function( req, res, next ) {
		if ( req.path == '/login' )
		{
			// any one can login
			console.log( "login detected." );
			next();
			return;
		}
		var nextAnonymous = function() {
			console.log( "Not authorized (<anonymous>)" )
			return this.authorize( req, res, next );
		}.bind( this )
		if ( !req.get('Authorization') )
			return nextAnonymous();
		var authHeader = req.get('Authorization').split( ' ' );
		if ( authHeader.length != 2 || authHeader[0] !== "Bearer" )
			return nextAnonymous();
		var token = authHeader[1]
		
		this.authenticateToken( token, function( err, identity ) {
			if ( !err && identity )
			{
				req.identity = identity;
				console.log( "Authenticated as " + req.identity );
				return this.authorize( req, res, next );
			}
			else
			{
				console.log( err );
				return nextAnonymous();	
			}
		}.bind( this ) )
	}.bind( this );
}

Authenticator.prototype.checkPermissions = function( rolePermissions, roleList, requestedPermission, cb ) {
	var authorized = false;
	_.forOwn( rolePermissions, function( value, key ) {
		if ( _.contains( roleList, key ) &&
			   _.contains( value, requestedPermission ) )
		{
			authorized = true;
			return false;
		}
	})
	if ( authorized )
		return cb( null );
	else
		return cb( "Permission denied." );
}

Authenticator.prototype.generateUUID = function() {
	return uuid.v4();
}

module.exports = Authenticator;