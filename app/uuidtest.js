var Authenticator = require( './lib/REM/lib/authentication' )

var auth = new Authenticator( {
	findUser: true,
	getEncryptedPassword: true,
	getPasswordSalt: true,
	getAllRoles: true
} )


auth.authenticateToken( "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6eyJuYW1lIjoidXNlciIsInJvbGVzIjpbImxheW1hbiJdfSwiaWF0IjoiMjAxNC0wNS0yNVQxMzowMDowOS41MDhaIiwiZXhwIjoxNDAxMDI2NDA5NTA4fQ.SXaA76NersAdTZVMi9MwdMS1uAEzfDFKfguUi38S_QE", function( err, id ) {
	console.log( id );
})