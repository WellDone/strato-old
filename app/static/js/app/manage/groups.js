define( [ 'jquery',
          'page',
          'hbars!views/manage/groups' ],
 function ( $, page, template ) {
 	return function () {
	 	$.getJSON( "/api/v0/groups", function( data ) {
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