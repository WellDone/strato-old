define( ['jquery',
         'page',
         'hbars!views/explore'], function( $, page, htmlTemplate ) {
	function exploreHandler( ctx, next ) {
		$('#content').html( htmlTemplate() );
		deactivate();
		var el = document.querySelector('.nav-sidebar [href="'+ctx.path+'"]');
		if ( el )
			el.parentNode.classList.add('active');
		next();
	}
 	
 	page( '/explore', exploreHandler );
 	//page( '/manage/group/:id', singleGroupHandler );

	//page( '/manage/monitors', monitorsHandler );
	//page( '/manage/monitor/:gsmid', singleMonitorHandler );
	return exploreHandler;
 })