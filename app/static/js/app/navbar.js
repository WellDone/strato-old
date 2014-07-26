define( [ 'jquery', 'app/session', 'page', 'app/loginForm' ], function( $, session, page, loginForm ) {
	function onSearchSubmit( e ) {
		e.preventDefault();
	}
	var searchForm = $('#navbar-search-form');
	searchForm.submit( onSearchSubmit );

	function updateNavbar() {
		loginForm.display( $( '#navbar-login-dropdown' ) )
		if ( session.exists() && session.getUser().user && session.getUser().user.fullname )
		{
			$( '#navbar-profile-username' ).text( session.getUser().user.fullname );
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

	$('#navbar-profile-logout').click( function(e) {
		e.preventDefault();
		session.logout();
		updateNavbar();
		page( "/" );
	})

	$(function () {
    $('#navbar-login-link').click(function () {
        loginForm.focus();
    });
	});

	return {
		hideSearch: function() {
			searchForm.addClass('hidden');
		},
		showSearch: function() {
			//searchForm.removeClass('hidden');
		},
		update: updateNavbar
	}
})