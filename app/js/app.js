var markerList = [
];

function initialize() {
    var mapOptions = {
        center: { lat: 53.562261, lng: 9.961613},
        zoom: 15
    };
    var map = new google.maps.Map(document.getElementById('map-canvas'),
                                  mapOptions);

    google.maps.event.addListener(map, 'click', function(e) {
        placeMarker(e.latLng, map);
    });
}

function placeMarker(position, map) {
  var marker = new google.maps.Marker({
      draggable: true, // to allow fine-tuning the position
      position: position,
      map: map
    });

  var infowindow = new google.maps.InfoWindow({
      content: "hello"
  });

  markerList.push({
         marker: marker,
         infowindow: infowindow
      });

  google.maps.event.addListener(marker,'click',function() {
      map.panTo(marker.getPosition());
      // Commenting out infowindow.open for now.
      // Rationale: Opening the window on click conflicts with closing it on
      // mouseout.  When clicking on a marker, the infowindow will open
      // briefly, but panning to the marker immediately results in a mouseout
      // event.
      //
      // I could use a boolean to only trigger the windows close in mouseout
      // when the window was opened with a mouseover, but I am not sure whether
      // that behavior remains intuitive.
      //
      // In this context, also take into account the Best Practices Tip from
      // https://developers.google.com/maps/documentation/javascript/infowindows:
      // For the best user experience, only one info window should be open on
      // the map at any one time. Multiple info windows make the map appear
      // cluttered
      //
      // infowindow.open(marker.get('map'), marker);
  });
  google.maps.event.addListener(marker,'mouseover',function() {
      infowindow.open(marker.get('map'), marker);
  });

  google.maps.event.addListener(marker,'mouseout',function() {
      infowindow.close(marker.get('map'), marker);
  });
}

function loadScript() {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = '//maps.googleapis.com/maps/api/js?v=3.exp' +
      '&signed_in=true&callback=initialize';
  document.body.appendChild(script);
}

window.onload = loadScript;
