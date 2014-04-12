var Modeler = require( './lib/modeler' );

var manyToManyReferences = [];
function translateType( column )
{
	if ( column.type == 'string' )
	{
		if ( column.constraints.size && column.constraints.size.max )
			return "varchar(" + column.constraints.size.max + ")";
		else
			return "text";
	}
	else if ( column.type == 'int' )
	{
		return "integer";
	}
	else if ( column.type == 'float' )
	{
		return "float";
	}
	else if ( column.type == 'id' )
	{
		return "SERIAL"
	}
	else if ( column.type == 'point' )
	{
		return "point";
	}
	else if ( column.type == 'timestamp' )
	{
		return "timestamp";
	}
	else if ( column.type == 'json' )
	{
		return "json";
	}
	else if ( column.type == 'ref' )
	{
		if ( column.ref.manyToMany )
		{
			if ( column.ref.primary )
				manyToManyReferences.push( column.ref );
			return null;
		}
		else if ( !column.ref.plural )
		{
			var targetColumn = column.ref.target.columns[ column.ref.target.id ];
			if ( targetColumn.type == 'id' )
				targetColumn = { type: 'int' }
			return translateType( targetColumn );
		}
		else
		{
			return null;
		}
	}
	throw new Error( "Unable to translate column type '" + column.type + "'." );
}

function describeColumn( name, column )
{
	var description = [name];

	var type = translateType( column )
	if ( !type )
		return null;
	description.push( type );
	
	if ( column.constraints.unique )
		description.push( "UNIQUE" );
	if ( column.constraints.required )
		description.push( "NOT NULL" );
	if ( column.constraints.pkey )
		description.push( "PRIMARY KEY" );

	return description.join( ' ' );
}

function createReferenceTables( manyToManyReferences )
{
	var tables = {};
	for ( var r in manyToManyReferences )
	{
		var name = manyToManyReferences[r].source.name + "_to_" + manyToManyReferences[r].target.name;
		tables[name] = [];
		tables[name].push( describeColumn( manyToManyReferences[r].source.name + "_ref", {
			type: "ref",
			ref: {
				plural: false,
				target: manyToManyReferences[r].source
			},
			constraints: { required: true }
		} ) );
		tables[name].push( describeColumn( manyToManyReferences[r].target.name + "_ref", {
			type: "ref",
			ref: {
				plural: false,
				target: manyToManyReferences[r].target
			},
			constraints: { required: true }
		} ) );
		tables[name] = "\r\n\t" + tables[name].join(",\r\n\t");
	}
	return tables;
}

function generateSchema( model )
{
	var tables = {};
	for ( var r in model.resources )
	{
		var columns = [];
		for ( var c in model.resources[r].columns )
		{
			var column = describeColumn( c, model.resources[r].columns[c] );
			if ( column )
				columns.push( column )
		}
		tables[r] = "\r\n\t" + columns.join( ",\r\n\t" );
	}

	var referenceTables = createReferenceTables( manyToManyReferences );
	for ( var t in referenceTables )
	{
		tables[t] = referenceTables[t]
	}
	return {
		tables: tables,
		indices: {}
	}
}

module.exports = generateSchema;