function deactivate() {
	var el = document.querySelector('.nav-sidebar .active');
	if ( el )
		el.classList.remove('active');
}

define( [ 'jquery',
					'page',
					'app/navbar',
					'hbars!views/manage',
          'app/manage/groups',
          'app/manage/group',
          'app/manage/monitors',
          'app/manage/monitor',
          'app/manage/people',
          'app/manage/user',
          'app/loginForm',
          'app/session' ],
 function( $, page, navbar, htmlTemplate, groupsHandler, singleGroupHandler, monitorsHandler, singleMonitorHandler, peopleHandler, userHandler, loginForm, session ) {
 	function renderChrome(path) {
 		$('#content').html( htmlTemplate() );
		deactivate();
		var basePath = path.substring(1);
		basePath = basePath.substring( basePath.indexOf( '/' ) + 1, basePath.length );
		var index = basePath.indexOf( '/' );
		basePath = basePath.substring( 0, (index != -1)? index : basePath.length );

		var el = document.querySelector('.nav-sidebar [href="/manage/'+basePath+'"]');
		if ( el )
			el.parentNode.classList.add('active');
 	}
 	function manageHandler( ctx, next ) {
 		navbar.hideSearch()

 		if ( !session.exists() )
 		{
 			loginForm.display( $('#content'), ctx.path )
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
	page( '/manage/users/:id', manageHandler, userHandler );

	page( '/manage', manageHandler, function() {
		page( '/manage/monitors' );
	})
	return manageHandler;
 } );