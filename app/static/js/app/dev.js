define( [ 'jquery',
          'page',
          'app/session',
          'hbars!views/dev',
          'hbars!views/dev-query-response' ],
 function( $, page, session, templatePage, templateQueryResponse ) {
 	function selectTextClick(e) {
	 	e.preventDefault();

	 	var textElement = $(this).parent().siblings('pre');  

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

  	var textElement = $(this).parent().siblings('pre');
  	var selectElement = $(this).siblings('a.text-select');
  	if ( textElement.hasClass('hidden') )
  	{
  		textElement.removeClass('hidden');
  		selectElement.removeClass('hidden');
  		$(this).text("hide");
  	}
  	else
  	{
  		textElement.addClass('hidden');
  		selectElement.addClass('hidden');
  		$(this).text("show");
  	}
  }
  function repeatRequestClick(e) {
  	e.preventDefault();

  	$('#dev-method').val( $(this).parent().parent().find('span.method').text() );
  	$('#dev-url').val( $(this).parent().parent().find('span.url').text() );
  	updateBodyAllowed();
  }
  function updateBodyAllowed(e) {
 			if ( $('#dev-method').val() == 'GET' || $('#dev-method').val() == 'DELETE' )
 				$('#dev-body-container').addClass('hidden');
 			else
 				$('#dev-body-container').removeClass('hidden');
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
 		$('#dev-form').submit( function(e) {
 			e.preventDefault();
 			$('#dev-send').addClass('disabled');
 			$('#dev-output').find('pre.pretty-json').addClass('hidden');
 			$('#dev-output').find('a.response-toggle').text('show');
 			$('#dev-output').find('a.text-select').addClass('hidden');
 			
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
 			var startTime = new Date();
 			opts.complete = function(res) {
 				var success = ( res.status == 200 || res.status == 302 );
 				var endTime = new Date();
 				var templateData = {
 					method: method,
 					url: url,
 					statusCode: res.status,
 					labelType: success? "label-success" : "label-danger",
 					pretty: res.responseText,
 					raw: res.responseText,
 					timestamp: startTime.toLocaleString(),
 					size: res.getResponseHeader('Content-Length') || 0,
 					latency: endTime.valueOf() - startTime.valueOf()
 				}
 				try {
 					templateData.pretty = JSON.parse( templateData.pretty );
 				}
 				catch (e)
 				{
 				}
 				if ( typeof templateData.pretty != "string" )
 				{
 					templateData.pretty = JSON.stringify( templateData.pretty, undefined, 2 );
 					templateData.pretty = templateData.pretty.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			    templateData.pretty = templateData.pretty.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
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
 				outputDiv.html( templateQueryResponse( templateData ) );
 				outputDiv.find('a.text-select').click( selectTextClick );
 				outputDiv.find('a.response-toggle').click( toggleResponseClick );
 				outputDiv.find('a.request-repeat').click( repeatRequestClick );
				$('#dev-send').removeClass('disabled');
			}
 			session.request( opts, false )
 		})
 	}
	return devhandler;
 } );