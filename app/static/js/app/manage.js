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
 			return false;
 		navbar.hideSearch()
		$('#content').html( htmlTemplate() );
		deactivate();
		var el = document.querySelector('.nav-sidebar [href="'+ctx.path+'"]');
		if ( el )
			el.parentNode.classList.add('active');
		next();
	}
	page( '/manage/*', manageHandler );
 	
 	page( '/manage/groups', groupsHandler );
 	page( '/manage/groups/:id', singleGroupHandler );

 	page( '/manage/monitors', monitorsHandler );
	page( '/manage/monitors/:id', singleMonitorHandler );

	page( '/manage/people', peopleHandler );

	page( '/manage', function() {
		page( '/manage/monitors' );
	})
	return manageHandler;
 } );