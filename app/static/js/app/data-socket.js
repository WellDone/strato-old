define( [ 'socketio' ],
 function(io) {
 	var socket = io.connect(window.location.hostname);

 	return {
 		watch: function( resource ) {
 			socket.emit( 'watch', resource )
 			socket.on( 'new', function( data ) {
 				data.for
 			});
 			socket.on( 'update', function( data ) {

 			});
 			socket.on( 'delete', function( data ) {

 			});
 		}
 	}
 })