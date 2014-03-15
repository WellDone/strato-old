define( [ 'jquery',
          'page',
          'hbars!views/manage/monitors' ],
 function ( $, page, template ) {
 	return function () {
	 	$.getJSON( "/data/sites.json", function( data ) {
	 		if (!data)
	 			alert( "Failed to retrieve monitors!" );
	 		var monitors = [];
	 		for ( var i = 0; i < data.length; ++i ) {
	 			for ( var j = 0; j < data[i].monitors.length; ++j ) {
	 				data[i].monitors[j].site = { id: data[i].id, name: data[i].name };
	 				monitors.push( data[i].monitors[j]);
	 			}
	 		}
			$('#manage-content').html( template( { monitors: monitors } ) );
			$('tr.linkRow').click( function (e) {
				var event = e || window.event;
				page( "/manage/monitor/" + $(this).attr('data-gsmid') );
				e.stopPropagation();
			});
			$('td.siteLinkColumn').click( function(e) {
				var event = e || window.event;
				page( "/manage/site/" + $(this).attr('data-siteid') );
				e.stopPropagation();
			});
			$('a.editMonitor').click( function(e) {
				var event = e || window.event;
				page( "/manage/monitor/" + $(this).parent().parent().attr('data-gsmid') + "/edit" );
				e.stopPropagation();
			});
			$('a.deleteMonitor').click( function(e) {
				var event = e || window.event;
				page( "/manage/monitor/" + $(this).parent().parent().attr('data-gsmid') + "/delete" );
				e.stopPropagation();
			});
		});
	}
 }
);