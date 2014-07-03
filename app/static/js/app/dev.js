define( [ 'jquery',
          'page',
          'app/session',
          'hbars!views/dev' ],
 function( $, page, session, html ) {
 	var devhandler = function( ctx, next ) {
 		$('#content').html( html({
 			exists: session.exists(),
 			user: session.getUser() && session.getUser().user,
 			expiration: session.getExpiration(),
 			token: session.getToken()
 		}) );
 		$('#dev-form').submit( function(e) {
 			e.preventDefault();
 			var method = $('#dev-method').val();
 			var url = $('#dev-url').val();
 			var body = $('#dev-body').val();
 			if ( body )
 			{
 				try {
 					body = JSON.parse( body )
 				}
 				catch (e) {
 					//PASS
 				}
 			}
 			var opts = {
 				type: method,
 				url: url,
 				data: body
 			}
 			console.log( opts );
 			$('#dev-send').addClass('disabled');
 			opts.complete = function(result) {
 				var success = ( result.status == 200 || result.status == 302 );
 				var labelType = success? "label-success" : "label-warning";
 				$('#dev-output').html( result.responseText + "<br/>" + $('#dev-output').html() );
 				$('#dev-output').html( "<br/><span class='label " + labelType + "'>" + result.status + "</span>&nbsp;" + $('#dev-output').html() );
				$('#dev-output').html( "<strong>&gt;&nbsp;" + method + " " + url + "</strong>" + $('#dev-output').html() );
				console.log( result );
				$('#dev-send').removeClass('disabled');
			}
 			session.request( opts )
 		})
 	}
	return devhandler;
 } );