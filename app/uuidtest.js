var Authenticator = require( './lib/REM/lib/authentication' )

var auth = new Authenticator( {
	findUser: true,
	getEncryptedPassword: true,
	getPasswordSalt: true,
	getAllRoles: true
} )

console.log( process.argv[1] )
auth.encryptPassword( process.argv[1], null, function( err, pwd, salt ) {
	console.log( err );
	console.log( pwd );
	console.log( salt );
})