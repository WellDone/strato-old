var path = require( 'path' );
var express = require( 'express' );

var REM = require( './rem.js' );
var Modeler = require( './modeler.js' );
var REMResource = require( './resource.js' );

var verbs = [ 'get', 'post', 'del', 'put' ]
var verbAliases = {
	'add': 'push',
	'remove': 'del',
	'update': 'put'
}

function REMEngine( version, modelJSON, backend, options ) {
	this.options = options;
	this.version = version;

	this.backend = backend;
	this.model = Modeler.create( modelJSON );

	this.resources = [];
	for ( var r in this.model.top )
	{
		this.resources.push( new REMResource( r, this.model.top[r], this ) );
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

REMEngine.prototype.serve = function( app, baseurl ) {
	app.use( baseurl, express.json() );
	app.use( baseurl, express.urlencoded() );
	//app.use( baseurl, express.timeout( 5000 ) );

	var self = this;
	app.get( path.join( baseurl, '_version' ), function( req, res ) {
		res.send( 200, self.version.join('.') );
	});
	app.get( path.join( baseurl, '_types' ), function( req, res ) {
		res.send( 200, self.model.types );
	});
	app.get( path.join( baseurl, '_model' ), function( req, res ) {
		var model = {};
		for ( var r in self.model.top )
		{
			model[r] = {};
			for ( var c in self.model.top[r].columns )
			{
				if ( self.model.top[r].columns[c].ref )
					model[r][c] = "ref: " + self.model.top[r].columns[c].ref.target.name;	
				else
					model[r][c] = self.model.top[r].columns[c].type;
			}
		}
		res.send( 200, model );
	});

	for ( var i = 0; i < this.resources.length; ++i )
	{
		this.resources[i].serve( app, baseurl );
	}
}
REMEngine.prototype.resource = function( name ) {
	return this.resources[name];
}
REMEngine.prototype.r = REMEngine.prototype.resource;

REMEngine.prototype.sanitizeParams = function( resource, params ) {
	var filters = {};
	for ( var f in params )
	{
		var value = params[f];
		if ( f == 'id' )
			f = resource.model.id;

		if ( !resource.model.columns.hasOwnProperty( f ) )
			throw new Error( "Resource type '" + resource + "' has no property '" + f + "'" );

		filters[f] = value;
	}
	//TODO: nesting.
	return filters;
}

REMEngine.prototype.sanitizeBody = function( resource, method, body )
{
	for ( var f in body )
		if ( !resource.model.columns.hasOwnProperty( f ) )
			throw new Error( "Unrecognized column '" + f + "' for type '" + resource.name + "'." );
	for ( var c in resource.model.columns )
		if ( method == 'POST' && resource.model.columns[c].constraints.required && !body[c] )
			throw new Error( "Property '" + c + "' is required for type '" + resource.name + "'" );
	return body;
}

module.exports = REMEngine;