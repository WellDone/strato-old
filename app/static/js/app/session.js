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
				sessionData.token = window.sessionStorage.auth.token = null;
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
				'email': username,
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

	var resourcePermissions = function( resource ) {
		var level = 0
		if ( !this.getUser().roles )
			level = 0;
		else if ( this.getUser().roles.indexOf("master") != -1 )
			level = 3;
		else if ( this.getUser().roles.indexOf("apprentice") != -1 )
			level = 2;
		else if ( this.getUser().roles.indexOf("layman") != -1 )
			level = 1;
		
		return {
			readonly: ( level <= 1 ),
			edit: ( level >= 2 ),
			create: ( level >= 3 ),
			del: ( level >= 3 ),
		}
	}
	return {
		login: login,
		logout: logout,
		request: request,
		getJSON: getJSON,
		exists: function() { return sessionData && sessionData.token != null; },
		getUser: function() { return sessionData && sessionData.user; },
		getExpiration: function() { return sessionData && sessionData.expiration; },
		getToken: function() { return sessionData && sessionData.token; },
		resourcePermissions: resourcePermissions
	}
})