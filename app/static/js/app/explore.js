define( ['jquery',
         'hbars!views/explore'], function( $ ) {
	function exploreHandler( ctx, next ) {
		$('#content').html( htmlTemplate() );
		deactivate();
		var el = document.querySelector('.nav-sidebar [href="'+ctx.path+'"]');
		if ( el )
			el.parentNode.classList.add('active');
		next();
	}
 	
 	page( '/explore', sitesHandler );
 	page( '/manage/site/:id', singleSiteHandler );

	page( '/manage/monitors', monitorsHandler );
	page( '/manage/monitor/:gsmid', singleMonitorHandler );
	return exploreHandler;
 })