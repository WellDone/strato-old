var anyDB = require( 'any-db' );

var rem_sql = function( url, poolOptions ) {
	this.db = ( poolOptions ) ? anyDB.createPool( url, poolOptions ) : anyDB.createConnection( url );
	this.db.on( 'error', function(err) {
		throw err;
	})
}

rem_sql.prototype.assertValid = function()
{
	if ( !this.db )
		throw new Error( "No database has been attached to the PGSQL backend." );
}

function parseFilter( schema, filters )
{
	var columns = Object.keys( schema.columns );
	var conditions = [];
	var parameters = []
	if ( filters )
	{
		for ( var f in filters )
		{
			if ( typeof filters[f] == 'object' )
			{
				conditions.push( f + filters[f].operator + "$" + (parameters.length+1) );
				parameters.push( filters[f].value );
			}
			else
			{
				conditions.push( f + "=$" + (parameters.length+1) );
				parameters.push( filters[f] );
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
function parseBody( type, body, output )
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
rem_sql.prototype.streamQueryResults = function( sql, parameters, output )
{
	console.log( sql );
	console.log( "parameters: [ " + parameters.toString() + " ]" );
	var result = [];
	this.db.query( sql, parameters )
	.on( 'data', function( row ) {
		result.push( row );
	} )
	.on( 'end', function() {
		output( null, result );
	} )
	.on( 'error', function( err ) {
		console.log( err );
		output( "Database query failed. " + err.toString() );
	})
}
rem_sql.prototype.get = function( schema, type, filters, body, output )
{
	this.assertValid();	
	var parsedFilter = parseFilter( schema, filters );

	var sql = "SELECT " + parsedFilter.columns.join(", ") + " FROM " + type + parsedFilter.condition;
	this.streamQueryResults( sql, parsedFilter.parameters, output );
}

rem_sql.prototype.post = function( schema, type, filters, body, output )
{
	this.assertValid();
	if ( filters && filters.length )
		throw new Error( "Conditions are not allowed when doing a POST to a resource collection." );
	var parsedBody = parseBody( type, body );

	var sql = "INSERT INTO " + type + " (" + parsedBody.columns.join(", ") + ") VALUES (" + parsedBody.valueArgs.join(", ") + ")";
	this.streamQueryResults( sql, parsedBody.parameters, output );
}

rem_sql.prototype.put = function( schema, type, filters, body, output )
{
	this.assertValid();
	var parsedFilter = parseFilter( schema, filters );
	var parsedBody = parseBody( type, body );
	var parameters = parsedFilter.parameters.concat( parsedBody.parameters );

	var assignmentStrings = [];
	for ( var i = 0; i < parsedBody.columns.length; ++i )
	{
		var j = (i+parsedFilter.parameters.length+1);
		assignmentStrings.push( parsedBody.columns[i] + "=$"+ j );
	}

	var sql = "UPDATE " + type + " SET " + assignmentStrings.join( ", " ) + parsedFilter.condition;
	this.streamQueryResults( sql, parameters, output );
}

rem_sql.prototype.del = function( schema, type, filters, body, output )
{
	this.assertValid();
	var parsedFilter = parseFilter( schema, filters );

	var sql = "DELETE FROM " + type + parsedFilter.condition;
	this.streamQueryResults( sql, parsedFilter.parameters, output );
}

module.exports = rem_sql;