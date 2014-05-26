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
          'app/session' ],
 function( $, page, navbar, htmlTemplate, groupsHandler, singleGroupHandler, monitorsHandler, singleMonitorHandler, peopleHandler, session ) {
 	function manageHandler( ctx, next ) {
 		if ( !session.exists() )
 		{
 			page("/");
 			return;
 		}
 		navbar.hideSearch()
		$('#content').html( htmlTemplate() );
		deactivate();
		var el = document.querySelector('.nav-sidebar [href="'+ctx.path+'"]');
		if ( el )
			el.parentNode.classList.add('active');
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