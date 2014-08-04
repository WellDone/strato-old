define( ['jquery', 'hbars!views/loginForm', 'app/session', 'page'],
 function( $, loginTemplate, session, page ) {
 	return {
 		loginForm: null,
 		display: function( container, redirect ) {
 			container = $( container );
			container.html( loginTemplate() );
			this.loginForm = container.find( "#login-form" );

			var emailInput = this.loginForm.find("#login-email"),
			    passwordInput = this.loginForm.find("#login-password");
			
			if ( session.getUser() )
				emailInput.val( session.getUser().email )

	 		function onLoginSubmit( e ) {
				e.preventDefault();

				emailInput.parent().removeClass( 'has-error' );
				passwordInput.parent().removeClass( 'has-error' );

				var email = emailInput.val();
				var password = passwordInput.val();
				if ( email == "" )
				{
					emailInput.parent().addClass( 'has-error' );
					return;
				}

				passwordInput.parent().removeClass( 'has-error');
				container.find('#login-form-error').addClass('hidden')
				session.login( email, password, function( err ) {
					if ( !err )
					{
						require('app/navbar').update();
						if ( redirect )
							page( redirect );
						return;
					}

					passwordInput.val( "" );
					if ( err.status == 401 )
						passwordInput.parent().addClass( 'has-error');
					else
						container.find('#login-form-error').removeClass('hidden').html( '<strong>Error ' + err.status + '</strong> ' + err.statusText );
				} );
			}
			this.loginForm.submit( onLoginSubmit )
	 	},
	 	focus: function() {
	 		var input = this.loginForm.find("#login-email");
	 		setTimeout( function(){
	 			input.focus();
	 		}, 0 );
	 	}
	};
 })