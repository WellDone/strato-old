define( ['jquery','bootstrap-growl'],
 function( $, growl ) {
 	var alertsControler = {
 		show: function( alertText, options ) {
 			options = options || {};
 			options.offset = {
 				from: 'top',
 				amount: $('#content').position().top + 10
 			}
	 		$.bootstrapGrowl( alertText, options)
 		},
 		info: function( text, options ) {
 			options = options || {};
 			options.type = 'info';
 			alertsControler.show( text, options );
 		},
 		success: function( text, options ) {
 			options = options || {};
 			options.type = 'success';
 			alertsControler.show( text, options );
 		},
 		error: function( text, options ) {
 			options = options || {};
 			options.type = 'danger';
 			alertsControler.show( text, options );
 		}
 	}
 	return alertsControler;
 });