define( [ 'jquery',
          'page',
          'app/session',
          'hbars!views/dev',
          'hbars!views/dev-query-response' ],
 function( $, page, session, templatePage, templateQueryResponse ) {
 	var requestHistory = [];
 	function selectTextClick(e) {
	 	e.preventDefault();

	 	var textElement = $(this).siblings('pre#responseText');

	  if (document.body.createTextRange) { // ms
	    var range = document.body.createTextRange();
	    range.moveToElementText(textElement);
	    range.select();
	  } else if (window.getSelection) { // moz, opera, webkit
	    var selection = window.getSelection();            
	    var range = document.createRange();
	    range.selectNodeContents(textElement.get(0));
	    selection.removeAllRanges();
	    selection.addRange(range);
	  }
  }
  function toggleResponseClick(e) {
  	e.preventDefault();

  	var detailsElement = $(this).parent().siblings('.request-details');
  	if ( detailsElement.hasClass('hidden') )
  	{
  		detailsElement.removeClass('hidden');
  		$(this).removeClass('glyphicon-plus');
  		$(this).addClass('glyphicon-minus');
  	}
  	else
  	{
  		detailsElement.addClass('hidden');
  		$(this).removeClass('glyphicon-minus');
  		$(this).addClass('glyphicon-plus');
  	}
  }
  function repeatRequestClick(e) {
  	e.preventDefault();

  	$('#dev-method').val( $(this).parent().parent().find('span.method').text() );
  	$('#dev-url').val( $(this).parent().parent().find('span.url').text() );
  	$('#dev-body').val( $(this).parent().parent().parent().find('pre#requestData').text() );
  	$('#dev-url').focus();
  	updateBodyAllowed();
  }
  function updateBodyAllowed(e) {
 			if ( $('#dev-method').val() == 'GET' || $('#dev-method').val() == 'DELETE' )
 				$('#dev-body-container').addClass('hidden');
 			else
 				$('#dev-body-container').removeClass('hidden');
 		}
 	function prettifyJSON( json ) {
 		try {
			json = JSON.parse( json );
		}
		catch (e)
		{
		}
		if ( typeof json != "string" )
		{
			json = JSON.stringify( json, undefined, 2 );
			json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    	json = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
    	 function (match) {
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
    	 }
    	);
		}
		return json;
 	}
 	var devhandler = function( ctx, next ) {
 		$('#content').html( templatePage({
 			exists: session.exists(),
 			user: session.getUser() && session.getUser().user,
 			expiration: session.getExpiration(),
 			token: session.getToken()
 		}) );
 		$('#dev-link-clear').click( function(e) {
 			e.preventDefault();
 			$('#dev-output').html("");
 		})
 		$('#dev-method').change( updateBodyAllowed )
 		$('#dev-method').val('GET');
 		$('#dev-body').keyup( function(e) {
 			if ( $(this).val().length === 0 )
 			{
 				$('#dev-body-validjson-container').addClass( 'hidden' );
 				return;
 			}
 			
 			$('#dev-body-validjson-container').removeClass( 'hidden' );
 			try {
 				JSON.parse( $(this).val() );
 				$('#dev-body-validjson-icon').removeClass('glyphicon-remove');
 				$('#dev-body-validjson-icon').addClass('glyphicon-ok');
 			} catch (e) {
 				$('#dev-body-validjson-icon').removeClass('glyphicon-ok');
 				$('#dev-body-validjson-icon').addClass('glyphicon-remove');
 			}
 		} );
 		$('#dev-form').submit( function(e) {
 			e.preventDefault();
 			$('#dev-send').addClass('disabled');
 			$('#dev-output').find('.request-details').addClass('hidden');
  		$('#dev-output').find('span.response-toggle').addClass('glyphicon-plus').removeClass('glyphicon-minus');
 			$('#dev-output').find('a.text-select').addClass('hidden');
 			
 			var method = $('#dev-method').val();
 			var url = $('#dev-url').val();
 			var body = $('#dev-body').hasClass('hidden')? '' : $('#dev-body').val();
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
 			outputDiv.html( "<span style='margin-left:5px;' class='glyphicon glyphicon-refresh glyphicon-refresh-animate'></span><strong>&nbsp;" + method + " " + url + "</strong>" );
 			var opts = {
 				type: method,
 				url: url,
 				data: body
 			}
 			requestHistory.push( opts );
 			var startTime = new Date();
 			opts.complete = function(res) {
 				var success = ( res.status >= 200 && res.status < 300 );
 				var endTime = new Date();
 				var size = res.responseText.length;
 				if ( size >= 1024 )
 				{
 					size = '' + ( res.responseText.length / 1024 );
 					size = size.substring( 0, size.indexOf('.') + 2 ) + ' KB'
 				}
 				else
 				{
 					size = res.responseText.length + ' B';
 				}
 				var templateData = {
 					id: requestHistory.length,
 					method: method,
 					url: url,
 					statusCode: res.status,
 					statusText: res.statusText,
 					labelType: success? "label-success" : "label-danger",
 					request: prettifyJSON( opts.data ),
 					pretty: prettifyJSON( res.responseText ),
 					meta: res.getAllResponseHeaders(),
 					timestamp: startTime.toLocaleString(),
 					size: size,
 					latency: endTime.valueOf() - startTime.valueOf()
 				}
 				outputDiv.html( templateQueryResponse( templateData ) );
 				outputDiv.find('div.text-select').click( selectTextClick );
 				outputDiv.find('span.response-toggle').click( toggleResponseClick );
 				outputDiv.find('a.request-repeat').click( repeatRequestClick );
				$('#dev-send').removeClass('disabled');
			}
 			session.request( opts, false )
 		})
 	}
	return devhandler;
 } );