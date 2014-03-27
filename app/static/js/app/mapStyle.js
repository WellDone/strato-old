define( ['async!https://maps.google.com/maps/api/js?v=3&key=AIzaSyAjsPeRR5wIJrmmEu6a3sbSjVYgFVWbB_c&sensor=false'],
	function () {
		var overviewStyle = [
			{
				featureType: 'all',
				elementType: 'all',
				stylers: [
					{ saturation: -60 }
				]
			},
			{
				featureType: 'road.highway',
				elementType: 'all',
				stylers: [
					{ visibility: 'off' }
				]
			},
			{
				featureType: 'road.arterial',
				elementType: 'all',
				stylers: [
					{ visibility: 'off' }
				]
			},
			{
				featureType: 'road.local',
				elementType: 'all',
				stylers: [
					{ visibility: 'off' }
				]
			},
			{
				featureType: 'administrative.country',
				elementType: 'all',
				stylers: [
					{ visibility: 'off' }
				]
			},
			{
				featureType: 'administrative.province',
				elementType: 'all',
				stylers: [
					{ visibility: 'off' }
				]
			},
			{
				featureType: 'administrative.locality',
				elementType: 'all',
				stylers: [
					{ visibility: 'off' }
				]
			},
			{
				featureType: 'administrative.neighborhood',
				elementType: 'all',
				stylers: [
					{ visibility: 'off' }
				]
			},
			{
				featureType: 'administrative.land_parcel',
				elementType: 'all',
				stylers: [
					{ visibility: 'off' }
				]
			},
			{
				featureType: 'poi',
				elementType: 'all',
				stylers: [
					{ visibility: 'off' }
				]
			},
			{
				featureType: 'transit',
				elementType: 'all',
				stylers: [
					{ visibility: 'off' }
				]
			}
		];
		return new google.maps.StyledMapType(overviewStyle, {
			name: 'Styled Map'
		});
	}
);