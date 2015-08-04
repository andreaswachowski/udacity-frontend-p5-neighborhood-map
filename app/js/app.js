function initialize() {
    ko.applyBindings(new ViewModel());
}

function loadScript() {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//maps.googleapis.com/maps/api/js?v=3.exp' +
        '&signed_in=true&callback=initialize&libraries=places';
    document.body.appendChild(script);
}

var ViewModel = function() {
    var self = this;

    this.markers = ko.observableArray([]);
    this.markerId = 0;

    this.initialize = function() {
        var mapOptions = {
                center: { lat: 53.562261, lng: 9.961613},
                zoom: 15
            },
            map = new google.maps.Map(document.getElementById('map-canvas'),
                                      mapOptions),
            geocoder = new google.maps.Geocoder(),
            input = document.getElementById('pac-input'),
            defaultBounds = new google.maps.LatLngBounds();

        google.maps.event.addListener(map, 'click', function(e) {
            self.placeMarker(geocoder, e.latLng, map);
        });

        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    };

    this.destroyMarker = function(marker) {
        var markerArray = self.markers;
        var removedMarkerArray = markerArray.splice(markerArray.indexOf(marker),1);
        removedMarkerArray[0].marker.setMap(null); // remove marker from Google Map
    };

    this.placeMarker = function(geocoder, position, map) {
        var marker = new google.maps.Marker({
                position: position,
                map: map
            }),
            infowindow = new google.maps.InfoWindow();

        // See example at https://developers.google.com/maps/documentation/javascript/geocoding
        geocoder.geocode({'location': position}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (results[1]) {
                    infowindow.setContent(results[1].formatted_address);
                    infowindow.open(map, marker);
                    // Briefly display the result, then close the window to avoid
                    // having too
                    window.setTimeout(function() {
                        infowindow.close(map, marker);
                    },1500);
                } else {
                    window.alert('No results found');
                }
            } else {
                window.alert('Geocoder failed due to: ' + status);
            }
        });

        self.markers.push({
            title: "Marker " + (self.markerId++) + ": Click to change",
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
    };

    this.initialize();
};

window.onload = loadScript;
