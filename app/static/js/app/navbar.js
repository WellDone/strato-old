define( [ 'jquery', 'app/session' ], function( $, session ) {
	function onSearchSubmit( e ) {
		e.preventDefault();
	}
	var searchForm = $('#navbar-search-form');
	searchForm.submit( onSearchSubmit );

	var loginForm = $('#navbar-login-form');
	function onLoginSubmit( e ) {
		e.preventDefault();
		var username = loginForm.find("input[name=username]").val();
		var password = loginForm.find("input[name=password]").val();

		session.login( username, password, function( err ) {
			if ( !err )
			{
				loginForm.addClass( 'hidden' );
				session.request( {
					url: "/api/v0/monitors",
					type: "GET",
					complete: function( result ) {
						console.log( result );
					}
				})
			}
		} );

	}
	loginForm.submit( onLoginSubmit )

	return {
		hideSearch: function() {
			searchForm.addClass('hidden');
		},
		showSearch: function() {
			//searchForm.removeClass('hidden');
		}
	}
})