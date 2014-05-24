define( ['jquery'], function( $ ) {
	var sessionToken = window.sessionStorage.token;
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
					sessionToken = result.responseText;
					console.log( sessionToken );
					window.sessionStorage.token = sessionToken;
					cb( null );
				}
				else
				{
					cb( result.statusText );
				}
			}
		})
	}
	var request = function( opts ) {
		if ( sessionToken )
		{
			if ( !opts.headers )
				opts.headers = {};
			opts.headers['Authorization'] = "Bearer " + sessionToken
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
		request: request,
		getJSON: getJSON
	}
})