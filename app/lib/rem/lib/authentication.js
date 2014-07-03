var uuid = require( 'node-uuid' )
var jwt = require( 'jwt-simple' )
var crypto = require( 'crypto' )
var _ = require( 'lodash' )
var moment = require( 'moment' )

var defaultIterations = 10000
var keyLength = 64
var passwordMinLength = 6
var saltSize = 64

var tokenLifetimeHours = 1;

function getExpirationTime( base ) {
	base = moment( base );
	return base.add( 'hours', tokenLifetimeHours ).valueOf();
}

var Authenticator = function( data, jwtSecret ) {
	this.data = data;
	this.jwtSecret = jwtSecret;
}
Authenticator.prototype.authenticatePassword = function( user, plaintextPassword, cb ) {
	if ( !user )
		return cb( "Invalid authentication function parameters." )
	this.data.authenticate( user, function( err, auth ) {
		if ( err || !auth || !auth.encryptedPassword )
		{
			console.log( "Authenticator error: user " + JSON.stringify( user ) + " invalid: " + err )
			cb( "Invalid user." );
			return;
		}

		var opts = {
			encryptedPassword: auth.encryptedPassword,
			salt: new Buffer( auth.passwordSalt, 'base64' )
		}
		Authenticator.encryptPassword( plaintextPassword, opts, function( err, key ) {
			if ( err || key !== auth.encryptedPassword )
			{
				console.log( err );
				console.log( key );
				console.log( auth.encryptedPassword );
				return cb( "Invalid password." );
			}
			try
			{
				var now = new Date();
				var payload = {
					id: auth.identity,
					iat: now.valueOf(),
					exp: getExpirationTime( now )
				}
				var token = jwt.encode( payload, this.jwtSecret );
				return cb( null, token, payload );
			}
			catch (e)
			{
				return cb( e );
			}
		}.bind( this ) );
	}.bind( this ) );
}

Authenticator.prototype.authenticateToken = function( token, cb ) {
	try
	{
		var payload = jwt.decode( token, this.jwtSecret );
		if ( !payload.iat && !payload.exp )
			return cb( "Invalid token." )
		if ( payload.exp && payload.exp <= new Date()
			|| payload.iat && getExpirationTime( payload.iat ) <= new Date() )
			return cb( "Expired token." )
		return cb( null, payload.id );
	}
	catch (e)
	{
		return cb( e );
	}
}

Authenticator.prototype.login = function() {
	var self
	return function( req, res, next ) {
		if ( !req.body || !req.body.password )
		{
			res.send( 401, "Invalid login attempt." );
			return;
		}
		else
		{
			var user = _.omit( req.body, 'password' );
			this.authenticatePassword( user, req.body.password, function( err, token, payload ) {
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
					return;
				}
			} );
		}
	}.bind( this );
}

Authenticator.prototype.authorize = function( req, res, next ) {
	this.data.authorize( req.path, req.identity, req.method, function( err, permissions ) {
		if ( err || !permissions )
		{
			if ( err ) console.log( "Authorization error: " + err );
			if ( req.identity ) {
				res.send( 403, "Unauthorized!" );
				return;
			} else {
				res.set( "WWW-Authenticate", "Bearer")
				res.send( 401, "Authentication failed." );
				return;
			}
		}
		console.log( "Authorized for " + req.method + " " + req.path );
		console.log( "Permissions: " + JSON.stringify( permissions ) );
		req.permissions = permissions;
		next();
	} );
};

Authenticator.prototype.middleware = function() {
	return function( req, res, next ) {
		if ( req.path == '/login' )
		{
			// anyone can login
			console.log( "login detected." );
			next();
			return;
		}
		
		var nextAnonymous = function() {
			console.log( "No authentication (<anonymous>)" )
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
				console.log( "Authenticated as " + req.identity.id );
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

Authenticator.generateUUID = function() {
	return uuid.v4();
}
Authenticator.encryptPassword = function( plaintextPassword, options, cb ) {
	if ( !plaintextPassword || plaintextPassword.length < passwordMinLength )
		return cb( "Password does not meet the complexity requirements" );
	options = options || {};
	options.salt = options.salt || crypto.randomBytes(saltSize);
	options.iterations = options.iterations || defaultIterations;

	crypto.pbkdf2( plaintextPassword, options.salt, options.iterations, keyLength, function( err, key ) {
		if ( err )
			return cb( err );
		return cb( null, key.toString( 'base64' ), options.salt.toString( 'base64' ), options.iterations );
	} );
}

module.exports = Authenticator;