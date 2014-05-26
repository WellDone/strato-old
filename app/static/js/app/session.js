define( ['jquery', 'underscore', 'backbone'], function( $, _, Backbone ) {
	var sessionData = null;
	try
	{
		if ( window.sessionStorage.auth )
		{
			sessionData = JSON.parse( window.sessionStorage.auth );
			if ( new Date( sessionData.expiration ) <= new Date() )
			{
				console.log( "Session has expired." );
				sessionData = window.sessionStorage.auth = null;
			}
		}
	}
	catch (e)
	{
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
	var extendOpts = function( param ) {
		var opts = _.clone(param || {});
		if ( sessionData )
		{
			if ( !opts.headers )
				opts.headers = {};
			opts.headers['Authorization'] = "Bearer " + sessionData.token
		}
		return opts;
	}
	var request = function( opts ) {
		opts = extendOpts( opts );
		return $.ajax( opts );
	}
	var getJSON = function( url, cb ) {
		this.request( {
			url: url,
			type: "GET",
			success: cb
		});
	}

	Backbone.ajax = function(opts) {
		opts = extendOpts( opts );
		return Backbone.$.ajax(opts);
	}
	return {
		login: login,
		logout: logout,
		request: request,
		getJSON: getJSON,
		exists: function() { return (sessionData != null); },
		getUser: function() { return sessionData.user; }
	}
})