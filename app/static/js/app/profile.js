define( [ 'jquery',
	        'page',
	        'app/profile/settings' ],
 function( $, page, settingsHandler ) {
 	page( '/profile/settings', settingsHandler );
 	return function() {
 		page( '/profile/settings' );
 	}
 })