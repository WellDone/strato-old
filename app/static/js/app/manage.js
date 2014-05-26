function deactivate() {
	var el = document.querySelector('.nav-sidebar .active');
	if ( el )
		el.classList.remove('active');
}

define( [ 'jquery',
					'page',
					'app/navbar',
					'hbars!views/manage',
					'hbars!views/login',
          'app/manage/groups',
          'app/manage/group',
          'app/manage/monitors',
          'app/manage/monitor',
          'app/manage/people',
          'app/session' ],
 function( $, page, navbar, htmlTemplate, loginTemplate, groupsHandler, singleGroupHandler, monitorsHandler, singleMonitorHandler, peopleHandler, session ) {
 	function renderChrome(path) {
 		$('#content').html( htmlTemplate() );
		deactivate();
		var el = document.querySelector('.nav-sidebar [href="'+path+'"]');
		if ( el )
			el.parentNode.classList.add('active');
 	}
 	function manageHandler( ctx, next ) {
 		navbar.hideSearch()

 		if ( !session.exists() )
 		{
 			$('#content').html( loginTemplate() )
 			var loginForm = $('#login-form');
 			function onLoginSubmit( e ) {
				e.preventDefault();
				var username = loginForm.find("input[name=username]").val();
				var password = loginForm.find("input[name=password]").val();

				session.login( username, password, function( err ) {
					if ( !err )
					{
						navbar.update();
						renderChrome( ctx.path );
						next()
					}
					loginForm.find("input[name=username]").val( "" );
					loginForm.find("input[name=password]").val( "" );
				} );
			}
			loginForm.submit( onLoginSubmit )
 			return;
 		}
 		renderChrome( ctx.path )
		next();
	}
 	page( '/manage/groups', manageHandler, groupsHandler );
 	page( '/manage/groups/:id', manageHandler, singleGroupHandler );

 	page( '/manage/monitors', manageHandler, monitorsHandler );
	page( '/manage/monitors/:id', manageHandler, singleMonitorHandler );

	page( '/manage/people', manageHandler, peopleHandler );

	page( '/manage', manageHandler, function() {
		page( '/manage/monitors' );
	})
	return manageHandler;
 } );