function deactivate() {
	var el = document.querySelector('.nav-sidebar .active');
	if ( el )
		el.classList.remove('active');
}

define( [ 'jquery',
					'page',
          'app/manage/sites',
          'app/manage/site',
          'app/manage/monitors',
          'app/manage/monitor',
          'hbars!views/manage' ],
 function( $, page, sitesHandler, singleSiteHandler, monitorsHandler, singleMonitorHandler, htmlTemplate ) {
 	function manageHandler( ctx, next ) {
		$('#content').html( htmlTemplate() );
		deactivate();
		var el = document.querySelector('.nav-sidebar [href="'+ctx.path+'"]');
		if ( el )
			el.parentNode.classList.add('active');
		next();
	}
	page( '/manage/*', manageHandler );
 	
 	page( '/manage/sites', sitesHandler );
 	page( '/manage/site/:id', singleSiteHandler );

	page( '/manage/monitors', monitorsHandler );
	page( '/manage/monitor/:id', singleMonitorHandler );

	page( '/manage', function() {
		page( '/manage/monitors' );
	})
	return manageHandler;
 } );