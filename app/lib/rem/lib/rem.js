var fs = require( 'fs' );
var path = require( 'path' );

var REMEngine = require( './rem-engine' );
var REMSQL;

function REM( options ) {
	if ( !options || !options.path )
		throw new Error( "REM option 'path' is required." );

	this.options = options;
	this.options.path = path.resolve( options.path );

	this.logger = this.options.logger;
	if ( !this.logger ) 
	{
		this.logger = {
			log: function( level, log ) { console.log( level + ": " + log ); },
			info: function( log ) { this.log( "info", log ); },
			error: function( log ) { this.log( "error", log ); }
		};
	}

	if ( !this.options.backend )
	{
		var complex = ( typeof this.options.db == 'object' );
		if ( !this.options.db || ( complex && !this.options.db.url ) )
			throw new Error( "No database url or custom backend specified." );
		var url = ( complex ) ? this.options.db.url : this.options.db;
		var poolOptions = 
		  ( complex && this.options.db.connectionPool ) ? this.options.db.connectionPool
		                                                : null;
		REMSQL = require( './rem-sql' );
		this.backend = ( new REMSQL( url, poolOptions, this.logger ) );
	}
	else
	{
		this.backend = this.options.backend;
	}
	this.options.serveLatest = (options.serveLatest)? true : false;

	this.engineCount = 0;
	this.engines = [];
	this.versionHeirarchy = {
		latest: null
	};

	this.loadSchemas( this.options.path );
}

REM.prototype.loadSchemas = function( basePath, next )
{
	var self = this;

	var files = fs.readdirSync( basePath );
	if ( files.length == 0 ) {
		next( new Error( "No REM schema files found in base directory '" + basePath + "'" ) );
		return;
	}
	for ( var i = 0; i < files.length; ++i )
	{
		try
		{
			self.loadSchemasFile( path.join( basePath, files[i] ) );
		}
		catch ( e )
		{
			this.logger.error( "Failed to add schema version " + files[i] + ": " + e );
		}
	}
	this.logger.info( "Latest API version is " + this.latest().version.join('.') );
}

REM.prototype.addVersion = function( versions, index )
{
	var iter = this.versionHeirarchy;
	var i = 0;
	for ( ; i < versions.length-1; ++i )
	{
		if ( !iter[ versions[i] ] )
		{
			iter[ versions[i] ] = {
				latest: null
			};
		}
		else
		{
			if ( typeof iter[ versions[i] ] != 'object' )
			{
				throw new Error( "An engine with a less-specific version (" + 
				                 versions.slice(0,i).join(',') + ") has already been loaded." );
			}
		}

		if ( iter.latest == null || versions[i] > iter.latest )
			iter.latest = versions[i];

		iter = iter[ versions[i] ];
	}

	if ( iter.hasOwnProperty( versions[i] ) )
		throw new Error( "Cannot add engine, an engine with version '"
		                  + versions.join('.') + "' already exists." );
	iter[ versions[i] ] = index;
	if ( versions[i] != 'dev' && ( iter.latest == null || versions[i] > iter.latest ) )
		iter.latest = versions[i];

	this.logger.info( "Loaded API schema version " + versions.join('.') + "." );
}

REM.prototype.addEngine = function( versions, engine )
{
	this.addVersion( versions, this.engines.length );
	this.engines.push( engine );

	var latest = this.latest();
	var verbs = [ 'get', 'post', 'del', 'put', 'add', 'remove', 'update' ]
	for ( var f in verbs )
	{
		var v = verbs[f];
		if ( latest[v] && !this[v] )
			this[v] = latest[v].bind(latest);
	}
}

REM.prototype.parseVersion = function( versionString )
{
	if ( !versionString )
		return [];

	var versions = versionString;
	if ( typeof versions == 'string' )
		versions = versionString.split( '.' );

	for ( var i = 0; i < versions.length; ++i )
	{
		if ( versions[i] == 'x' || versions[i] == 'latest' )
		{
			versions.splice( i );
			break;
		}
		else if ( isNaN( parseInt( versions[i] ) ) 
		       && !( i != 0 && i == versions.length-1 && versions[i] == 'dev' ) )
		{
			throw new Error( "Invalid REM version specifier '" + versionString + "': " +
				               "REM only supports integer heirarchical versions" +
				               " and i.e. '3.dev' for unstable development." );
		}
	}
	return versions;
}

REM.prototype.loadSchemasFile = function( file ) {
	var extension = path.extname( file );
	if ( extension == '.json' )
	{
		var basename = path.basename( file );
		var name = basename.substr( 0, basename.length - extension.length );
		
		var versions = this.parseVersion( name );
		if ( versions.length == 0 )
			throw new Error( "Invalid REM schema version '" + name + "'." );
		for ( var i = versions.length; i < this.options.depth; ++i )
			versions.push( '0' );
		
		var schema = fs.readFileSync( file );
		this.addEngine( versions, new REMEngine( versions, schema, this.backend, this.options ) )
	}
}

function getLatest( iter )
{
	while ( typeof iter == 'object' )
		iter = iter[iter.latest];
	return iter;
}

REM.prototype.version = function( v ) {
	var versions = this.parseVersion( v );
	var iter = this.versionHeirarchy;
	var i = 0;
	for ( ; i < versions.length; ++i )
	{
		if ( !iter.hasOwnProperty( versions[i] ) )
			throw new Error( "No REM engine with version '" + v + "' exists." );

		iter = iter[versions[i]];
	}
	iter = getLatest( iter );

	return this.engines[iter];

}
REM.prototype.v = REM.prototype.version;
REM.prototype.latest = function() {
	return this.version();
}

REM.prototype.serve = function( app, basePath )
{
	var self = this;
	function serveVersion( versionString, versionObject )
	{
		if ( versionString != "" || self.options.serveLatest )
		{
			var url = path.join( basePath, (versionString != "") ? "v" + versionString : "" );
			
			var engine = getLatest( versionObject );
			self.engines[ engine ].serve( app, url );
			self.logger.info( "Serving API version " + self.engines[engine].version.join('.') + " at " + url + "." );
		}

		for ( var v in versionObject )
		{
			if ( v != 'latest' )
				serveVersion( (versionString.length == 0) ? v : versionString + "." + v, versionObject[v] );
		}
	}
	serveVersion( "", this.versionHeirarchy );
}

module.exports = REM;