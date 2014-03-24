define( [ 'jquery',
          'page',
          'hbars!views/manage/group' ],
 function ( $, page, template ) {
 	return function ( ctx, next ) {
 		var site;
 		$.getJSON( "/data/sites.json", function( data ) {
 			for ( var i=0; i < data.length; ++i )
 			{
 				if ( data[i].id == ctx.params.id ) {
 					site = data[i];
 					break;
 				}
 			}

 			if ( site ) {
 				$( '#manage-content' ).html( template( site ) )
 				$('tr.linkRow').click( function () {
					page( $(this).attr('data-url') );
				})
 			}
 		} );
 	}
 } );