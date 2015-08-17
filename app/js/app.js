/**
 * @file Includes the application.
 * @author Andreas Wachowski
 *
 * @todo I would like to wrap the whole code into an IFFY to avoid
 * cluttering the global namespace (and to 'use strict' for everything).
 * But then the callback in loadScript will not work, because initialize()
 * is still assumed to be called on the window object. I don't know yet how
 * I should change the callback to make it work.
 */

/**
 * @global
 */
var model = {
    places: []
};

/**
 * @external "google.maps"
 * @see {@link https://developers.google.com/maps/documentation/javascript/3.exp/reference"|Google Maps API Reference}
 */

/**
 * @class Map
 * @memberof external:"google.maps"
 */

/**
 * @class LatLngLiteral
 * @memberof external:"google.maps"
 */

/**
  * Constructs a Place object. This is the core of the model.
  * (even though it still contains ko.observables, which I don't think
  * should be in the model?!)
  * @constructor
  * @param {Map} map - The map on which a marker for this place shall be added.
  * @param {LatLngLiteral} position - The position of the place.
  */
var Place = function(map,position) {
    this.title = ko.observable("");
    this.position = {
        lat: position.lat(),
        lng: position.lng()
    };
    this.formatted_address = "";
    this.editing = ko.observable(false);
    this.marker = new google.maps.Marker({
        position: position,
        map: map
    });
    this.infowindow = new google.maps.InfoWindow();
};

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

/**
 * Initializes the view model.
 */
function initialize() {
    ko.applyBindings(new ViewModel());
}

/**
 * Loads the google map code and bootstraps the application.
 */
function loadScript() {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//maps.googleapis.com/maps/api/js?v=3.exp' +
        '&signed_in=true&callback=initialize';
    document.body.appendChild(script);
}

/**
 * @class ViewModel
 *
 * An instance of this will call its initialize method which initializes
 * and renders the map and all other functionality.
 */
var ViewModel = function() {
    var self = this;

    self.places = ko.observableArray(model.places);

    self.query = ko.observable('');

    // The general idea stems from JohnMav at https://discussions.udacity.com/t/search-box-filtering/26749
    // more specifically his example at http://codepen.io/JohnMav/pen/OVEzWM
    // It just had to be augmented to not just filter the list, but also
    // show/hide the markers on the map
    self.search = ko.computed( function() {
        return ko.utils.arrayFilter(self.places(), function(place) {
            var isMatch = place.title().toLowerCase().indexOf(self.query().toLowerCase()) >= 0;
            place.marker.setVisible(isMatch);
            return isMatch;
        });
    });

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
            // An infowindow might be open when for example a place in
            // the marker list was clicked. Unless we close that window
            // here, it would remain open (unless manually closed later) in
            // addition to the window pertaining to the newly set marker.
            self.closeInfoWindows();
            self.addPlace(geocoder, e.latLng, map);
        });

        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    };

    this.destroyPlace = function(place) {
        var placesArray = self.places;
        var removedPlacesArray = placesArray.splice(placesArray.indexOf(place),1);
        removedPlacesArray[0].marker.setMap(null); // remove marker from Google Map
    }; // TODO: Why does TodoMVC append ".bind(this);"?

    this.editPlace = function (place) {
        place.editing(true);
        // TODO: Save *all* place information, not just the title
        place.previousTitle = place.title();
    }; // TODO: Why does TodoMVC append ".bind(this);"?

    // stop editing a place.  Remove it, if its title is now empty
    this.saveEditing = function (place) {
        place.editing(false);

        var title = place.title();
        var trimmedTitle = title.trim();

        // Observable value changes are not triggered if they're consisting of whitespaces only
        // Therefore we've to compare untrimmed version with a trimmed one to check whether anything changed
        // And if yes, we've to set the new value manually
        if (title !== trimmedTitle) {
            place.title(trimmedTitle);
        }

        // The infowindow has to be set in all cases since it is not a KO
        // observable. TODO: Should I make it one? Why? Why not?
        place.infowindow.setContent(self.infoWindowContent(place));

        if (!trimmedTitle) {
            this.destroyPlace(place);
        }
    }; // TODO: Why does TodoMVC append ".bind(this);"?

    // cancel editing a marker and revert it to the previous content
    this.cancelEditing = function (place) {
        place.editing(false);
        place.title(place.previousTitle);
    }.bind(this);

    this.addPlace = function(geocoder, position, map) {
        var // TODO: Use the literal object as a starting point to create a
            // proper Marker class (as part of the model)
            place = new Place(map,position),
            gMarker = place.marker;

        // Initialize formatted_address and title
        // See example at https://developers.google.com/maps/documentation/javascript/geocoding
        geocoder.geocode({'location': position}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    // TODO: There is usually a *lot* more that can be
                    // extracted from the results.
                    place.formatted_address = results[0].formatted_address;
                } else {
                    place.formatted_address = 'unknown, no result found';
                }
            } else {
                place.formatted_address = 'unknown, Geocoder failed due to ' + status;
                window.alert('Geocoder failed due to: ' + status);
            }
            place.title(place.formatted_address);
            place.infowindow.setContent(self.infoWindowContent(place));
        });

        self.places.push(place);

        // Scroll to bottom of list. When the list overflows, this helps
        // understanding that new places are indeed added.
        var placeDiv = document.getElementById("marker-list");
        placeDiv.scrollTop = placeDiv.scrollHeight;

        // Briefly display the result, then close the window to avoid
        // having too many open infowindows.
        place.infowindow.open(gMarker.get('map'), gMarker);
        window.setTimeout(function() {
            place.infowindow.close();
        }, 1500);

        google.maps.event.addListener(gMarker,'click',function() {
            map.panTo(gMarker.getPosition());
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
            // infowindow.open(gMarker.get('map'), gMarker);
        });

        google.maps.event.addListener(gMarker,'mouseover',function() {
            place.infowindow.open(gMarker.get('map'), gMarker);
        });

        google.maps.event.addListener(gMarker,'mouseout',function() {
            place.infowindow.close(gMarker.get('map'), gMarker);
        });
    };

    this.infoWindowContent = function(place) {
        var str = '<h3>'+place.title() + '</h3>' +
            '<div>'+place.formatted_address + '</div>';
        // TODO: It would be much nicer to keep this HTML in index.html.
        // Can I use knockout templates? (I think I would have to, because
        // there might be multiple info windows shown. But how do I bind to
        // the various places?
        //var str='<div data-bind="template: { name: \'infowindow-template\', data: place }"></div>';
        return str;
    };

    this.closeInfoWindows = function() {
        // Close any open infowindows. Actually, it should at most one be open.
        self.places().forEach(function (currentValue, index, array) {
            currentValue.infowindow.close();
        });
    };

    /* showMarker is executed when the user single-clicks on an entry in
     * the marker list
     */
    this.showPlace = function(place) {
        var gMarker = place.marker;
        gMarker.getMap().panTo(gMarker.getPosition());
        self.closeInfoWindows();
        place.infowindow.open(gMarker.get('map'), gMarker);
    };

    this.initialize();
};

window.onload = loadScript;
