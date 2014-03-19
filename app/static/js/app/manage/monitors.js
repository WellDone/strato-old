define( [ 'jquery',
          'page',
          'hbars!views/manage/monitors' ],
 function ( $, page, template ) {
 	return function () {
	 	$.getJSON( "/api/v0/monitors", function( monitors ) {
			$('#manage-content').html( template( { monitors: monitors } ) );
			$('tr.linkRow').click( function (e) {
				var event = e || window.event;
				page( "/manage/monitor/" + $(this).attr('data-monitorid') );
				e.stopPropagation();
			});
			$('td.siteLinkColumn').click( function(e) {
				var event = e || window.event;
				page( "/manage/site/" + $(this).attr('data-siteid') );
				e.stopPropagation();
			});
			$('a.editMonitor').click( function(e) {
				var event = e || window.event;
				page( "/manage/monitor/" + $(this).parent().parent().attr('data-monitorid') + "/edit" );
				e.stopPropagation();
			});
			$('a.deleteMonitor').click( function(e) {
				var event = e || window.event;
				page( "/manage/monitor/" + $(this).parent().parent().attr('data-monitorid') + "/delete" );
				e.stopPropagation();
			});
		});
	}
 }
);