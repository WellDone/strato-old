define( [ 'jquery', 'app/session' ], function( $, session ) {
	function onSearchSubmit( e ) {
		e.preventDefault();
	}
	var searchForm = $('#navbar-search-form');
	searchForm.submit( onSearchSubmit );

	var loginForm = $('#navbar-login-form');
	function updateNavbar() {
		if ( session.exists() )
		{
			$( '#navbar-profile-username' ).text( session.getUser().name );
			$( '#navbar-login' ).addClass( 'hidden' );
			$( '#navbar-profile' ).removeClass( 'hidden' );
			$( '#navbar-manage' ).removeClass( 'hidden' );
			$( '#navbar-explore' ).removeClass( 'hidden' );
		}
		else
		{
			$( '#navbar-profile-username' ).text( "<anonymous>" );
			$( '#navbar-login' ).removeClass( 'hidden' );
			$( '#navbar-profile' ).addClass( 'hidden' );
			$( '#navbar-manage' ).addClass( 'hidden' );
			$( '#navbar-explore' ).addClass( 'hidden' );
		}
	}

	updateNavbar();

	function onLoginSubmit( e ) {
		e.preventDefault();
		var username = loginForm.find("input[name=username]").val();
		var password = loginForm.find("input[name=password]").val();

		session.login( username, password, function( err ) {
			if ( !err )
			{
				updateNavbar();
			}
		} );
	}
	loginForm.submit( onLoginSubmit )

	$('#navbar-profile-logout').click( function(e) {
		e.preventDefault();
		session.logout();
		updateNavbar();
	})
	$('#navbar-profile-settings').click( function(e) {
		e.preventDefault();
		
	})

	return {
		hideSearch: function() {
			searchForm.addClass('hidden');
		},
		showSearch: function() {
			//searchForm.removeClass('hidden');
		}
	}
})