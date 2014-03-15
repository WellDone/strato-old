define( [ 'jquery',
          'page',
          'hbars!views/manage/sites' ],
 function ( $, page, template ) {
 	return function () {
	 	$.getJSON( "/data/sites.json", function( data ) {
	 		if (!data)
	 			alert( "Failed to retrieve sites!" );
			$('#manage-content').html( template( { sites: data } ) );
			$('tr.linkRow').click( function () {
				page( $(this).attr('data-url') );
			})
		});
	}
 }
);