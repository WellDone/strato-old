define( ['jquery'], function( $ ) {
	var sessionData = null;
	try
	{
		if ( window.sessionStorage.auth )
			sessionData = JSON.parse( window.sessionStorage.auth );
	}
	catch (e)
	{
		console.log( "Failed to parse auth data: " + window.sessionStorage.auth )
	}
	var login = function( username, password, cb ) {
		$.ajax({
			url: '/api/login',
			type: 'POST',
			data: {
				'user': username,
				'password': password
			},
			complete: function(result) {
				if ( result.status == 200 )
				{
					loginResult = JSON.parse( result.responseText );

					console.log( loginResult );
					sessionData = {
						token : loginResult.token,
						expiration : new Date( loginResult.data.exp ),
						user : loginResult.data.id
					}
					window.sessionStorage.auth = JSON.stringify( sessionData );
					cb( null, sessionData.user );
				}
				else
				{
					cb( result.statusText );
				}
			}
		})
	}
	var logout = function() {
		window.sessionStorage.auth = null;
		sessionData = null;
	}
	var request = function( opts ) {
		if ( sessionData )
		{
			if ( !opts.headers )
				opts.headers = {};
			opts.headers['Authorization'] = "Bearer " + sessionData.token

			//TODO: Renew soon-to-expire tokens
		}
		return $.ajax( opts );
	}
	var getJSON = function( url, cb ) {
		this.request( {
			url: url,
			type: "GET",
			success: cb
		});
	}
	return {
		login: login,
		logout: logout,
		request: request,
		getJSON: getJSON,
		getData: function() { return sessionData; }
	}
})