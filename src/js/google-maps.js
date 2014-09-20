$(function() {
	/* ==========================================================================
	   Maps
	   ========================================================================== */
		if($('#gmap').length) {
			$('[data-click="maps"]').on('click', function(e) {
				$(this).addClass('active');
				$('[data-maps-link]').prop('href', $(this).data('link'));
				if(map) {
					var position = new google.maps.LatLng($(this).data('lat'), $(this).data('lng'));
					map.panTo(position);
					map.setCenter(position);
				}
				e.preventDefault();
			});
			window.onload = loadScript;
		}
});

/* ==========================================================================
   Google Maps
   ========================================================================== */

function initialize() {
	var markers = [];
	$('.maps').each(function(index, item) {
		markers.push({ lat: $(this).data('lat'), lng: $(this).data('lng'), title: $(this).data('title') });
	});
	var mapOptions = {
		zoom: 12,
		center: new google.maps.LatLng(markers[0].lat, markers[0].lng),
		mapTypeControl: true,
		mapTypeControlOptions: { style: google.maps.MapTypeControlStyle.DROPDOWN_MENU },
		navigationControl: true,
		navigationControlOptions: { style: google.maps.NavigationControlStyle.SMALL },
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};

	map = new google.maps.Map(document.getElementById('gmap'), mapOptions);

	$(markers).each(function(index, item) {
		var marker = new google.maps.Marker({
			position: new google.maps.LatLng(item.lat, item.lng),
			map: map,
			title: item.title
		});
	});

	var center;
	google.maps.event.addDomListener(map, 'idle', function () { center = map.getCenter(); });
	google.maps.event.addDomListener(window, 'resize', function () { map.setCenter(center); });
}

function loadScript() {
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=initialize';
	document.body.appendChild(script);
}
