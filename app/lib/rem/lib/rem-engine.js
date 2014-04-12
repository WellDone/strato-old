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
		var model = Modeler.simplify( self.model );
		res.send( 200, model );
	});
	if ( this.backend.schema )
		app.get( path.join( baseurl, '_schema' ), function( req, res ) {
			var schema = self.backend.schema( self.model );
			res.set('Content-Type', 'text/plain');
			res.send( 200, schema );
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
		order: 'default'
	};

	if ( params.fields )
	{
		params.fields.forEach( function( f ) {
			if ( !resource.model.columns.hasOwnProperty( f ) || resource.model.columns[f].ref )
				throw new Error( "Resource type '" + resource + "' has no local property '" + f + "'" );
			out.fields.push( f );
		});
	}
	if ( out.fields.length === 0 ) {
		for ( var c in resource.model.columns )
		{
			if ( !resource.model.columns[c].ref )
				out.fields.push( c );
		}
	}

	for ( var w in params.where )
	{
		out.where[w] = params.where[w];
	}

	if ( params.id )
		out.where[resource.model.id] = params.id;
	
	console.log( params, out );
	return out;
}

REMEngine.prototype.sanitizeBody = function( resource, method, body )
{
	for ( var f in body )
		if ( !resource.model.columns.hasOwnProperty( f ) )
			throw new Error( "Unrecognized column '" + f + "' for type '" + resource.name + "'." );
	for ( var c in resource.model.columns )
		if ( method.toLowerCase() == 'post' && resource.model.columns[c].constraints.required && !body[c] )
			throw new Error( "Property '" + c + "' is required for type '" + resource.name + "'" );
	return body;
}

module.exports = REMEngine;