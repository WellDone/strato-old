define( [ 'jquery',
          'page',
          'hbars!views/manage/monitors' ],
 function ( $, page, template ) {
 	function render() {
	 	$.getJSON( "/api/v0/monitors", function( monitors ) {
	 		for ( var m in monitors )
	 		{
	 			if ( monitors[m].id % 3 === 0 )
	 				monitors[m].status = { class: 'warning', text: 'Unclear' };
	 			else if ( monitors[m].id % 5 === 0 )
	 				monitors[m].status = { class: 'danger', text: 'Bad' };
	 			else
	 				monitors[m].status = { class: 'success', text: 'Good' };
	 			monitors[m].groups = [{name:'MyMonitors'}]; 
	 		}
			$('#manage-content').html( template( { monitors: monitors } ) );

			$('#deleteModal').modal( { show: false } );

			$('tr.linkRow').click( function (e) {
				var event = e || window.event;
				page( "/manage/monitor/" + $(this).attr('data-monitorid') );
				e.stopPropagation();
			});
			$('a.editMonitor').click( function(e) {
				var event = e || window.event;
				page( "/manage/monitor/" + $(this).parent().parent().attr('data-monitorid') + "/edit" );
				e.stopPropagation();
			});
			$('a.deleteMonitor').click( function(e) {
				var event = e || window.event;
				var monitorID = $(this).parent().parent().attr('data-monitorid');
				var delFunc = function() {
					$.ajax({
						url: '/api/v0/monitors/' + monitorID,
						type: 'DELETE',
						complete: function(result) {
							console.log( "DELETED!" );

							$('#delete-modal').modal('hide');
							//TODO: These shouldn't be needed, but they are.
							$('body').removeClass('modal-open');
							$('.modal-backdrop').remove();

							render();
						}
					});
					$('#actually-delete-button').off( 'click', delFunc );
				}
				$('#deleteModal').modal('show');
				$('#actually-delete-button').on( 'click', delFunc );
				e.stopPropagation();
			});
			$('#new-monitor-button').click( function(e) {
				$.ajax({
					url: '/api/v0/monitors',
					type: 'POST',
					data: {
						"name": "Test",
						"location": "(-6.8167,39.2839)",
						"gsmid": "+0000000"
					},
					complete: function(result) {
						console.log( "ADDED!" );
						render();
					}
				});
				e.stopPropagation();
			})
		});
	}
	return render;
 }
);