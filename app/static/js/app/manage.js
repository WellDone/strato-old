function deactivate() {
	var el = document.querySelector('.nav-sidebar .active');
	if ( el )
		el.classList.remove('active');
}

define( [ 'jquery',
					'page',
          'app/manage/groups',
          'app/manage/group',
          'app/manage/monitors',
          'app/manage/monitor',
          'hbars!views/manage' ],
 function( $, page, groupsHandler, singleGroupHandler, monitorsHandler, singleMonitorHandler, htmlTemplate ) {
 	function manageHandler( ctx, next ) {
		$('#content').html( htmlTemplate() );
		deactivate();
		var el = document.querySelector('.nav-sidebar [href="'+ctx.path+'"]');
		if ( el )
			el.parentNode.classList.add('active');
		next();
	}
	page( '/manage/*', manageHandler );
 	
 	page( '/manage/groups', groupsHandler );
 	page( '/manage/group/:id', singleGroupHandler );

	page( '/manage/monitors', monitorsHandler );
	page( '/manage/monitor/:id', singleMonitorHandler );

	page( '/manage', function() {
		page( '/manage/monitors' );
	})
	return manageHandler;
 } );