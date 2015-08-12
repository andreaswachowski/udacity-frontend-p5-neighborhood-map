// TODO: I would like to wrap the whole code into an IFFY to avoid
// cluttering the global namespace (and to 'use strict' for everything).
// But then the callback in loadScript will not work, because initialize()
// is still assumed to be called on the window object. I don't know yet how
// I should change the callback to make it work.

// The key handling functionality comes straight from TodoMVC's KnockoutJS
// example.
var ENTER_KEY = 13;
var ESCAPE_KEY = 27;

// A factory function we can use to create binding handlers for specific
// keycodes.
function keyhandlerBindingFactory(keyCode) {
    return {
        init: function (element, valueAccessor, allBindingsAccessor, data, bindingContext) {
            var wrappedHandler, newValueAccessor;

            // wrap the handler with a check for the enter key
            wrappedHandler = function (data, event) {
                if (event.keyCode === keyCode) {
                    valueAccessor().call(this, data, event);
                }
            };

            // create a valueAccessor with the options that we would want to pass to the event binding
            newValueAccessor = function () {
                return {
                    keyup: wrappedHandler
                };
            };

            // call the real event binding's init function
            ko.bindingHandlers.event.init(element, newValueAccessor, allBindingsAccessor, data, bindingContext);
        }
    };
}

// a custom binding to handle the enter key
ko.bindingHandlers.enterKey = keyhandlerBindingFactory(ENTER_KEY);

// another custom binding, this time to handle the escape key
ko.bindingHandlers.escapeKey = keyhandlerBindingFactory(ESCAPE_KEY);

// wrapper to hasFocus that also selects text and applies focus async
ko.bindingHandlers.selectAndFocus = {
    init: function (element, valueAccessor, allBindingsAccessor, bindingContext) {
        ko.bindingHandlers.hasFocus.init(element, valueAccessor, allBindingsAccessor, bindingContext);
        ko.utils.registerEventHandler(element, 'focus', function () {
            element.focus();
        });
    },
    update: function (element, valueAccessor) {
        ko.utils.unwrapObservable(valueAccessor()); // for dependency
        // ensure that element is visible before trying to focus
        setTimeout(function () {
            ko.bindingHandlers.hasFocus.update(element, valueAccessor);
        }, 0);
    }
};

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
    }; // TODO: Why does TodoMVC append ".bind(this);"?

    this.editMarker = function (marker) {
        marker.editing(true);
        // TODO: Save *all* marker information, not just the title
        marker.previousTitle = marker.title();
    }; // TODO: Why does TodoMVC append ".bind(this);"?

    // stop editing a marker.  Remove it, if its title is now empty
    this.saveEditing = function (marker) {
        marker.editing(false);

        var title = marker.title();
        var trimmedTitle = title.trim();

        // Observable value changes are not triggered if they're consisting of whitespaces only
        // Therefore we've to compare untrimmed version with a trimmed one to chech whether anything changed
        // And if yes, we've to set the new value manually
        if (title !== trimmedTitle) {
            marker.title(trimmedTitle);
        }

        if (!trimmedTitle) {
            this.destroyMarker(marker);
        }
    }; // TODO: Why does TodoMVC append ".bind(this);"?

    // cancel editing a marker and revert it to the previous content
    this.cancelEditing = function (marker) {
        marker.editing(false);
        marker.title(marker.previousTitle);
    }.bind(this);

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

        // TODO: Use the literal object as a starting point to create a
        // proper Marker class (as part of the model)
        self.markers.push({
            title: ko.observable("M" + (self.markerId++)), // + ": Double-click to change"),
            editing: ko.observable(false),
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
