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
 		$('#dev-link-clear').click( function(e) {
 			e.preventDefault();
 			$('#dev-output').html("");
 		})
 		$('#dev-form').submit( function(e) {
 			e.preventDefault();
 			$('#dev-send').addClass('disabled');
 			
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
 			var outputDiv = $('<div></div>');
 			$('#dev-output').prepend( outputDiv );
 			outputDiv.html( "<strong>&gt;&nbsp;" + method + " " + url + "</strong>&nbsp" );
 			var opts = {
 				type: method,
 				url: url,
 				data: body
 			}
 			console.log( opts );
 			opts.complete = function(result) {
 				var success = ( result.status == 200 || result.status == 302 );
 				var labelType = success? "label-success" : "label-warning";
 				var text = result.responseText;
 				try {
 					text = JSON.parse( text );
 				}
 				catch (e)
 				{
 					console.log( e );
 				}
 				if ( typeof text != "string" )
 				{
 					text = JSON.stringify( text, undefined, 2 );
 					text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			    text = text.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
			        var cls = 'dev number';
			        if (/^"/.test(match)) {
			            if (/:$/.test(match)) {
			                cls = 'dev key';
			            } else {
			                cls = 'dev string';
			            }
			        } else if (/true|false/.test(match)) {
			            cls = 'dev boolean';
			        } else if (/null/.test(match)) {
			            cls = 'dev null';
			        }
			        return '<span class="' + cls + '">' + match + '</span>';
			    });
 				}
		    text = "<pre class='dev'>" + text + "</pre>";
		    var statusLabel = "<span class='label " + labelType + "'>" + result.status + "</span>"
 				outputDiv.html( outputDiv.html() + statusLabel + text );
				console.log( result );
				$('#dev-send').removeClass('disabled');
			}
 			session.request( opts )
 		})
 	}
	return devhandler;
 } );