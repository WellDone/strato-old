var express = require( "express" );
var app = express();

var REM = require( './rem' );

var rem = new REM( { 
	path: '../api/',
	db: {
		url: "postgres://dbadmin:GikmnmJKDOB3@localhost:5432/welldone",
		connectionPool: { min: 2, max: 10 }
	}
} );

rem.serve( app, "/api" );

app.listen( 10000 );