var anyDB = require( 'any-db' );
var schemaGenerator = require( '../rem-sql-genschema' );

var rem_sql = function( url, poolOptions, logger ) {
	this.db = ( poolOptions ) ? anyDB.createPool( url, poolOptions ) : anyDB.createConnection( url );
	this.db.on( 'error', function(err) {
		throw err;
	})
	this.logger = logger;
}

rem_sql.prototype.assertValid = function()
{
	if ( !this.db )
		throw new Error( "No database has been attached to the PGSQL backend." );
}

function makeJunctionTableName( ref )
{
	if ( ref.primary )
		return ref.source.name + "_to_" + ref.target.name;
	else
		return ref.target.name + "_to_" + ref.source.name;
}

function constructQuery( type, model, params, body)
{
	var query;
	var parameters = [];
	var joins = []
	if ( type == "select" )
	{
		var columns = [];
		var conditions = [];
		var tables = [ model.name ];

		for ( var c in params.fields )
		{
			columns.push( model.name + "." + params.fields[c] );
		}
		for ( var f in params.where )
		{
			var operator;
			var value;
			if ( typeof params.where[f] == 'object' )
			{
				operator = params.where[f].operator;
				value = params.where[f].value;
			}
			else
			{
				operator = "=";
				value = params.where[f];
			}

			if ( model.columns[f].ref && !model.columns[f].ref.manyToMany )
			{
				var target = model.columns[f].ref.target;
				tables.push( target.name );
				conditions.push( model.name + "." + f + " " + operator + " " + target.name + "." + target.id );
				conditions.push( target.name + "." + target.id + " = $" + (parameters.length+1) );
				parameters.push( value );
			}
			else if ( model.columns[f].ref && model.columns[f].ref.manyToMany )
			{
				if ( operator != "=" )
					throw new Error( "Bad operator for many-to-many condition" )
				var target = model.columns[f].ref.target;
				var junction = makeJunctionTableName( model.columns[f].ref );
				var joinID = "joinTable" + joins.length;
				joins.push( "RIGHT OUTER JOIN ( " + 
					      "\r\n                   SELECT " + junction + "." + model.name + "_ref" +
					      "\r\n                   FROM " + junction + 
					      "\r\n                   WHERE " + junction + "." + target.name + "_ref = $" + (parameters.length+1) + ")" + " AS " + joinID +
					      "\r\n  ON " + joinID + "." + model.name + "_ref = " + model.name + "." + model.id );
				parameters.push( value );
			}
			else
			{
				conditions.push( [f, operator, "$" + (parameters.length+1)].join(" ") );
				parameters.push( value );
			}
			
		}
		query = "SELECT " + columns.join( ", \r\n\t" )
		     + "\r\nFROM " + tables.join( ", " )
		     + ( conditions.length?"\r\nWHERE " + conditions.join( "\r\n AND " ) : "" )
		     + ( joins.length? "\r\n" + joins.join( "\r\n" ) : "" )
		     + ";"
	}
	else if ( type == "")
	{}

	return {
		sql: query,
		parameters: parameters
	}
}

function parseFilter( model, params )
{
	var columns = Object.keys( model.columns );

	var conditions = [];
	var parameters = [];
	if ( params && params.where )
	{
		for ( var f in params.where )
		{
			if ( typeof params.where[f] == 'object' )
			{
				conditions.push( f + params.where[f].operator + "$" + (parameters.length+1) );
				parameters.push( params.where[f].value );
			}
			else
			{
				conditions.push( f + "=$" + (parameters.length+1) );
				parameters.push( params.where[f] );
			}
		}
	}
	var condition = (conditions.length > 0)? " WHERE " + conditions.join(' AND ') : ""
	return {
		columns: columns,
		condition: condition,
		parameters: parameters
	}
}
function parseBody( body )
{
	var columns = [];
	var parameters = [];
	var valueArgs = [];
	for ( var i in body )
	{
		columns.push( i );
		parameters.push( body[i] );
		valueArgs.push( "$" + parameters.length );
	}

	return {
		columns: columns,
		parameters: parameters,
		valueArgs: valueArgs
	}
}
function transformRow( model, row ) {
	for ( var c in model.columns )
	{
		var ref = model.columns[c].ref;
		if ( row.hasOwnProperty( c ) && ref && ref.plural && row[c] == null )
		{
			row[c] = []; // Remove nulls where references didn't exist.
		}
	}
	return row;
}
rem_sql.prototype.streamQueryResults = function( sql, parameters, transform, output )
{
	this.logger.info( "Running SQL query:\r\n", sql, "\r\nparameters: [ " + parameters.toString() + " ]" );
	
	var result = [];
	var self = this;
	this.db.query( sql, parameters )
	.on( 'data', function( row ) {
		result.push( transform( row ) );
	} )
	.on( 'end', function() {
		output( null, result );
	} )
	.on( 'error', function( err ) {
		self.logger.error( err );
		output( "Database query failed. " + err.toString() );
	})
}
rem_sql.prototype.get = function( model, type, params, body, output )
{
	this.assertValid();	

	var query = constructQuery( "select", model, params, body );

	this.streamQueryResults( query.sql, query.parameters, transformRow.bind( null, model ), output );
}

rem_sql.prototype.post = function( model, type, params, body, output )
{
	this.assertValid();
	if ( params && params.length )
		throw new Error( "Conditions are not allowed when doing a POST to a resource collection." );
	var parsedBody = parseBody( body );

	var sql = "INSERT INTO " + type + " (" + parsedBody.columns.join(", ") + ") VALUES (" + parsedBody.valueArgs.join(", ") + ")";
	this.streamQueryResults( sql, parsedBody.parameters, transformRow.bind( null, model ), output );
}

rem_sql.prototype.put = function( model, type, params, body, output )
{
	this.assertValid();
	var parsedFilter = parseFilter( model, params );
	var parsedBody = parseBody( type, body );
	var parameters = parsedFilter.parameters.concat( parsedBody.parameters );

	var assignmentStrings = [];
	for ( var i = 0; i < parsedBody.columns.length; ++i )
	{
		var j = (i+parsedFilter.parameters.length+1);
		assignmentStrings.push( parsedBody.columns[i] + "=$"+ j );
	}

	var sql = "UPDATE " + type + " SET " + assignmentStrings.join( ", " ) + parsedFilter.condition;
	this.streamQueryResults( sql, parameters, transformRow.bind( null, model ), output );
}

rem_sql.prototype.del = function( model, type, params, body, output )
{
	this.assertValid();
	var parsedFilter = parseFilter( model, params );

	var sql = "DELETE FROM " + type + parsedFilter.condition;
	this.streamQueryResults( sql, parsedFilter.parameters, transformRow.bind( null, model ), output );
}

rem_sql.prototype.schema = function( model )
{
	var schema = schemaGenerator( model );
	return schema;
}
rem_sql.prototype.schemaString = function( model )
{
	var schema = this.schema( model );
	var schemaString = "";
	for ( var t in schema.tables ) {
		schemaString += "CREATE TABLE " + t + " (" + schema.tables[t] + "\r\n);\r\n";
	}
	for ( var i in schema.indices ) {
		schemaString += "CREATE INDEX " + i + " " + schema.indices[i] + "\r\n";
	}
	return schemaString;
}

module.exports = rem_sql;