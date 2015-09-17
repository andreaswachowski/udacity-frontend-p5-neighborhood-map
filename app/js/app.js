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

// This application only uses Foursquare's userless API calls, therefore
// a client id and client secret are sufficient.
var FOURSQUARE_CLIENT_ID; /* Initialize this! */
var FOURSQUARE_CLIENT_SECRET; /* Initialize this! */

/**
 * Loads the google map code and bootstraps the application.
 * Called at window.onload, see end of file.
 */
function loadScript() {
    if (navigator.onLine) {
        $('#offline-on-load').remove(); // just in case, if we were offline at start.

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp' +
        '&signed_in=true&callback=initialize';
        document.body.appendChild(script);
    } else {
        if ($('#offline-on-load').length === 0) {
            $('<div id="offline-on-load" class="white-on-red-warning">').html('The browser is offline. Connect to the Internet and wait for the page to reload').appendTo('body');
        }
        setTimeout(loadScript, 3000);
    }
}

/**
 * Initializes the view model. Called from loadScript().
 */
function initialize() {
    // the ViewModel *must* be initialized not earlier than here, in initialize(),
    // because otherwise the google.* objects are not yet loaded, and the ViewModel
    // code would not run
    ko.applyBindings(new ViewModel());

}

/**
 * @global
 */
var model = {
    map: {
        // center: { lat: 42.3580212, lng: -71.0955016 }, // MIT
        center: { lat: 37.4274641, lng: -122.1697382 }, // Stanford
        initialZoomFactor: 15
    },
    places: [] // elements are of type Place, see below
};

var getPlaceTitles = function() {
    return model.places.map(function(e) {
        return e.title();
    });
};

// See http://twitter.github.io/typeahead.js/examples/
var substringMatcher = function() {
    return function findMatches(q, cb) {
        var matches, substringRegex;

        // an array that will be populated with substring matches
        matches = [];

        // regex used to determine if a string contains the substring `q`
        substrRegex = new RegExp(q, 'i');

        // iterate through the pool of strings and for any string that
        // contains the substring `q`, add it to the `matches` array
        $.each(getPlaceTitles(), function(i, str) {
            if (substrRegex.test(str)) {
                matches.push(str);
            }
        });

        cb(matches);
    };
};

$('.scrollable-dropdown-menu .typeahead').typeahead({
    hint: true,
    highlight: true,
    minLength: 1,
    // It would be nice to be able to map the typeahead class names to the bootstrap class names
    // and be done with it. But typeahead uses <divs> instead of <li>s, and groups each dataset
    // in an additional <div>, instead of using one single <ul>
    // classNames : {
    //     menu: 'dropdown-menu'
    // }
}, {
    name: 'places',
    limit: 10,
    source: substringMatcher()
});

/**
 * @external "google.maps"
 * @see {@link https://developers.google.com/maps/documentation/javascript/3.exp/reference|Google Maps API Reference}
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
 * @class Place
 * Constructs a Place object. This is the core of the model.
 * (even though it still contains ko.observables, which I don't think
 * should be in the model?!)
 * @constructor
 * @param {Map} map - The map on which a marker for this place shall be added.
 * @param {LatLng} position - The position of the place.
 */
var Place = function(position) {
    this.id = Place.getId(); // the id is used to synchronize places with mapMarkers
    this.title = ko.observable('');
    this.position = {
        lat: position && position.lat(),
        lng: position && position.lng()
    };
    // TODO(refactor): Use consistent naming convention, here: camelCase
    this.formatted_address = ko.observableArray();
    this.categories = ko.observableArray();
    //this.address = '';
    this.editing = ko.observable(false);
    this.venues = ko.observableArray();
};

/**
 * Returns an auto-incrementing ID.
 *
 * @see {@link http://javascript.info/tutorial/static-variables-methods-decorators}
 */
Place.getId = function() {
    arguments.callee.count = ++arguments.callee.count || 1;
    return arguments.callee.count;
};

/**
 * Augments the Place object with Foursquare venues.
 * @param {Array} venues - An array of Foursquare compact venues, as returned by the Foursquare venue search API
 * @see {@link https://developer.foursquare.com/docs/responses/venue}
 */
Place.prototype.addVenues = function(venues,viewModel) {
    // Extract just the information we need from the Foursquare object
    // and assign it to the Place's venues property (which is a
    // ko.observableArray).
    this.venues(venues.map(function (v) {
        var categories = v.categories.map(function (c) {
            // The prefix contains an asset server domain, for which a permission denied error is given on access.
            // Therefore we insert the generic foursquare domain instead.
            var iconSize = '32';
            var iconUrl = c.icon.prefix.replace(/^http[s]:\/\/[^/]*/,'https://foursquare.com') + iconSize + c.icon.suffix;
                return { name: c.name,
                    primary: c.primary,
                    iconUrl: iconUrl
                };
            });
        return {
            id: v.id,
            location: v.location,
            name: v.name,
            contact: v.contact,
            categories: categories
        };
    }).sort(function(v1,v2) {
        return v1.location.distance > v2.location.distance;
    }));
};

/**
 * @class ErrorMsg
 *
 * Provides just a few static methods to simplify error output.
 */
var ErrorMsg = function() {
};

ErrorMsg.showWarning = function(message) {
    $('<div id="warningmsg" class="white-on-red-warning">').html(message).appendTo(".sidebar-page-content-wrapper");
    window.setTimeout(function() {
        $('#warningmsg').remove();
    }, 2000);
    console.warn(message);
};

ErrorMsg.showError = function(message) {
    $('<div id="errormsg" class="white-on-red-warning">').html(message).appendTo(".sidebar-page-content-wrapper");
    window.setTimeout(function() {
        $('#errormsg').remove();
    }, 2000);
    console.error(message);
};

/**
 * @class Foursquare
 *
 * Constructs a Foursquare api object. This object is currently
 * only intended for userless access.
 * @constructor
 * @param {String} clientId - The Foursquare API client id
 * @param {String} clientSecret - The Foursquare API client secret
 */
var Foursquare = function(clientId, clientSecret) {
    this.baseUrl = 'https://api.foursquare.com/v2';
    this.apiVersion = '20150824';

    this.clientId = clientId;
    this.clientSecret = clientSecret;
};

Foursquare.showMissingCredentialsError = function() {
    ErrorMsg.showWarning("To use Foursquare functionality, add Foursquare API credentials to app.js.");
};

Foursquare.prototype.validApiCredentials = function() {
    var validCredentials = this.clientId && this.clientSecret;
    if (!validCredentials) {
        ErrorMsg.showWarning("No valid Foursquare API credentials provided. Foursquare API calls won't be made. To fix, initialize FOURSQUARE_CLIENT_ID and FOURSQUARE_CLIENT_SECRET in app.js appropriately.");
    }
    return validCredentials;
};

/**
 * Given a location, search Foursquare for the most likely venues at that
 * location.
 * @param {LatLngLiteral} position - The position of the venue.
 * @param {Number} limit - The maximum number of venues returned
 * @param {function} callback - A function with two parameters, result and status, that handles the response
 * @see {@link https://developer.foursquare.com/docs/venues/search}
 */
Foursquare.prototype.searchVenueAtPosition = function(position, limit, callback) {
    // Note: With more Foursquare methods, we would not want to remember to
    // add this check in every method. Instead we might then use a State pattern.
    if (!this.validApiCredentials()){
        return;
    }

    // Making an AJAX call in plain vanilla Javascript.
    // Adapted from http://stackoverflow.com/questions/8567114/how-to-make-an-ajax-call-without-jquery
    var xmlhttp = new XMLHttpRequest();
    var venues;

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
            var errMsg;
            if(xmlhttp.status == 200) {
                // TODO From a security viewpoint, I suppose that using
                // eval() boils down to trusting the Foursquare servers
                // The API returns an array called 'venues'
                venues = eval('('+xmlhttp.responseText+')').response.venues;
            } else {
                errMsg = JSON.parse(xmlhttp.responseText).meta.errorDetail;
                console.error("XMLHttpRequest returned with status " + xmlhttp.status + ": " + errMsg);
            }
            callback(venues,xmlhttp.status,errMsg);
        }
    };

    var url = this.baseUrl + '/venues/search?ll=' + position.lat + ',' + position.lng +
        '&limit=' + limit +
        this.apiCallPostFix();
    xmlhttp.open('GET', url, true);
    xmlhttp.send();
};

Foursquare.prototype.apiCallPostFix = function() {
    return '&client_id=' + this.clientId +
        '&client_secret=' + this.clientSecret +
        '&v=' + this.apiVersion;
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
 * @class ViewModel
 *
 * An instance of this will call its initialize method which initializes
 * and renders the map and all other functionality.
 */
var ViewModel = function() {
    var self = this;
    self.infoWindow = new google.maps.InfoWindow();

    self.places = ko.observableArray(model.places);
    self.currentPlace = ko.observable();

    // if API credentials available, Foursquare will be initialized in self.initialize
    self.foursquare;

    // To cleanly separate the model (ie places with lat/lng, an address, a title etc.)
    // from the view (esp. Google markers), the markers are tracked in a separate array,
    // which is kept in sync with the model via a subscription on self.places (see further down).
    //
    // This approach is taken from http://jsfiddle.net/qtzmz/, referenced from
    // http://stackoverflow.com/questions/16482309/the-simpliest-way-to-subscribe-for-an-observablearray-in-knockoutjs
    //
    // In particular, this separation is necessary in order to use localStorage. For once, the space requirements would
    // increase when storing the full google marker objects.
    // More importantly, I ran into same-origin-policy problems while attempting to store, because Google is accessed via
    // HTTPS, and this application may run on HTTP.
    self.mapMarkers = [];

    self.query = ko.observable('');

    self.lookupMarkerFromPlace = function(place) {
        var i=0;
        var found=false;
        var marker;
        while (!found && i<self.mapMarkers.length) {
            found = self.mapMarkers[i].id === place.id;
            if (!found) ++i;
        }
        if (found) marker = self.mapMarkers[i];
        return marker;
    };

    // The general idea stems from JohnMav at https://discussions.udacity.com/t/search-box-filtering/26749
    // more specifically his example at http://codepen.io/JohnMav/pen/OVEzWM
    // It just had to be augmented to not just filter the list, but also
    // show/hide the markers on the map
    self.search = ko.computed( function() {
        return ko.utils.arrayFilter(self.places(), function(place) {
            var isMatch = place.title().toLowerCase().indexOf(self.query().toLowerCase()) >= 0;

            var marker = self.lookupMarkerFromPlace(place);

            // The marker will not always be looked up successfully:
            //
            // This ko.computed-callback is called after a change to a place, e.g. after a new place is added, and after the
            // place's geocode results come in. (This is not optimal because this means O(n2) executions of this scope
            // (with n the number of additions), but due to the small number of places that's neglible.).
            //
            // The problem is, this part here is executed *before* self.places's subscription is executed, and the latter is
            // responsible to keep places and mapMarkers in sync. So at this point, the marker cannot be found yet, and we
            // hence have to guard against that with an if-statement.
            // (On the other hand, when the user enters filter queries, the markers are already initialized, and the
            // visibility will be set without problems.)

            if (marker) {
                marker.setVisible(isMatch);
            }
            return isMatch;
        });
    });

    self.uniqueMatch = function(searchFieldText) {
        // TODO(refactor): The matching algorithm is coded twice, once in the substringMatcher, and once here. So if
        // we want to change it, we have to do it in two places. Merge this.
        var substrRegex = new RegExp(searchFieldText, 'i');
        var matchingPlaces = model.places.filter(function(e) {
            return substrRegex.test(e.title());
        });
        return matchingPlaces.length === 1 ? matchingPlaces[0] : false;
    };

    self.panToMatchIfUnique = function() {
        var searchFieldText = $('.tt-input').val();
        var uniquePlace = self.uniqueMatch(searchFieldText);
        if (uniquePlace) {
            self.showPlace(uniquePlace);
            // Clear the text field so subsequent actions, like choosing a marker from the dropdown,
            // will not lead to confusion
            $('.searchclear').addClass('hidden');
            $('.typeahead').typeahead('val', '');
            $('.tt-input').blur().val('');
            $('#go').addClass('hidden');
            self.query(''); // Make sure all markers are visible again
        }
        // else ignore
        // TODO(feat): This condition could trigger a warning, like a wobble effect or a red flash,
        // to show the user that too many places are selected
    };

    self.createMarker = function(map,place) {
        var gMarker = new google.maps.Marker({
            id: place.id, // the ids must be equal so that self.places and self.mapMarkers can be synced
            position: place.position,
            animation: google.maps.Animation.DROP,
            map: map
        });

        google.maps.event.addListener(gMarker,'click',function() {
            map.panTo(gMarker.getPosition());
            self.bounceMarker(gMarker);
        });

        google.maps.event.addListener(gMarker,'mouseover',function() {
            self.openInfowindow(gMarker);
        });

        return gMarker;
    };

    self.destroyMarker = function(marker) {
        marker.setMap(null); // remove marker from Google Map
    };

    self.retrieveMapCenter = function() {
        var mapCenter;
        if (store.enabled) {
            mapCenter = store.get('mapCenter');
        }
        return mapCenter;
    };

    self.saveMapCenter = function() {
        if (store.enabled) {
            store.set('mapCenter',model.map.center);
        }
    };

    self.initialize = function() {
        var mapCenter = self.retrieveMapCenter();
        if (!mapCenter) {
            if (navigator.geolocation) {
                $('#geolocation-dialogue').removeClass('hidden');
                $('#geolocation-dialogue').click(function(ev) {
                    var permission = ev.target.id === "current-location-btn";

                    // In either case, save the map center for future sessions so it need not be chosen
                    // every time
                    if (permission) {
                        navigator.geolocation.getCurrentPosition(
                            function(position) {
                                model.map.center.lat = position.coords.latitude;
                                model.map.center.lng = position.coords.longitude;
                                self.saveMapCenter(model.map.center);
                                self.initializeMap();
                            },
                            function(error) {
                                ErrorMsg.showError("Could not retrieve geolocation: " + error.code + ' ' + error.message +
                                                   ", proceeding with default map center");
                                self.initializeMap();
                            },
                            {
                                enableHighAccuracy: false,
                                timeout: 30*1000, /* msec = 30 seconds */
                                maximumAge: 10*60*1000 /* msec = 10 minutes */
                            });
                    } else {
                        self.saveMapCenter(model.map.center);
                        self.initializeMap();
                    }
                });
            } else {
                // Not necessary to save the map center, since with no geolocation, it will never be changed
                // self.saveMapCenter(model.map.center);
                self.initializeMap();
            }
        } else {
            model.map.center = mapCenter;
            self.initializeMap();
        }
    };

    self.initializeMap = function() {
        $('#geolocation-dialogue').remove();
        $('nav').removeClass('hidden');
        $('#wrapper').removeClass('hidden');

        var mapOptions = {
                center: model.map.center,
                zoom: model.map.initialZoomFactor,
                mapTypeControlOptions: {
                    position: google.maps.ControlPosition.BOTTOM_LEFT
                }
            },
            map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions),
            geocoder = new google.maps.Geocoder(),
            defaultBounds = new google.maps.LatLngBounds();
            // input = document.getElementById('pac-input'),

        if (FOURSQUARE_CLIENT_ID && FOURSQUARE_CLIENT_ID) {
            self.foursquare = new Foursquare(FOURSQUARE_CLIENT_ID, FOURSQUARE_CLIENT_SECRET);
        } else {
            Foursquare.showMissingCredentialsError();
        }

        self.places.subscribe(function (places) {
            // Create reversed hashes by id of markers and mapMarkers
            var rev1 = {}, rev2 = {};
            var i;

            for (i = 0; i < places.length; i++) {
                rev1[places[i].id] = i;
            }
            for (i = 0; i < self.mapMarkers.length; i++) {
                rev2[self.mapMarkers[i].id] = i;
            }

            // Create new markers
            for (i = 0; i < places.length; i++) {
                if (rev2[places[i].id] === undefined) {
                    self.mapMarkers.push(self.createMarker(map,places[i]));
                    rev2[places[i].id] = self.mapMarkers.length-1;
                }
            }

            // Destroy non-existant markers
            for (i = 0; i < self.mapMarkers.length; i++) {
                if (rev1[self.mapMarkers[i].id] === undefined) {
                    self.destroyMarker(self.mapMarkers[i]);
                    self.mapMarkers.splice(i,1);
                    i--;
                }
            }

            self.storePlaces();
        });
        // Is valueHasMutated necessary? It is shown in http://jsfiddle.net/qtzmz/, but
        // we don't modify self.places, but self.mapMarkers, which is not an observable
        // self.places.valueHasMutated();

        self.loadPlaces();

        google.maps.event.addListener(map, 'click', function(e) {
            self.addPlace(geocoder, e.latLng, map);
        });


        $('.searchclear').click(function() {
            // TODO(refactor): How can I address the searchclear-elementset implicitly, without having to specify it again?
            // 'this' does not work, neither referring to a passed-in function argument
            $('.searchclear').addClass('hidden');
            $('#go').addClass('hidden');
            $('.typeahead').typeahead('val', '');
            $('.tt-input').val('').focus();
            self.query(''); // Trigger self.search, so sidebar shows all places again
        });

        $('#go').click(function(e) {
            self.panToMatchIfUnique();
            $('#go').addClass('hidden');
        });

        // When an autocomplete result is selected, trigger keyup so that the "Go" button is displayed
        $('.typeahead').bind('typeahead:select', function(ev, suggestion) {
            self.panToMatchIfUnique();
        });

        $('.tt-input').keyup(function(e) {
            // Hide info window that might still show after filtering for a previous place
            self.closeInfoWindow();

            var searchFieldText = $('.tt-input').val();
            if (searchFieldText === '') {
                $('.searchclear').addClass('hidden');
            } else {
                $('.searchclear').removeClass('hidden');
            }
            if (self.uniqueMatch(searchFieldText)) {
                $('#go').removeClass('hidden');
            } else {
                $('#go').addClass('hidden');
            }

            var code = e.which;
            if (code === ENTER_KEY) {
                self.panToMatchIfUnique();
            }
        });

        // Functionality to toggle the sidebar
        $("#menu-toggle").click(function(e) {
            e.preventDefault();
            $("#wrapper").toggleClass("toggled");

            // When the sidebar disappears, the map's right margin might contain unloaded tiles.
            // We force loading them by triggering 'resize'
            // The only important thing to remember is to trigger only after the CSS transition
            // has finished (and hence we use 500ms, exactly what is specified for the transition)
            window.setTimeout(function() {
                google.maps.event.trigger(map, 'resize');
            }, 500);
        });

        // Rotate the triangle when an accordion element is shown
        // Use event delegation to avoid adding a handler on every place
        $('#accordion').on('show.bs.collapse', function (ev) {
            $('[data-target="#'+ev.target.id+'"]').toggleClass('opened');
        });

        $('#accordion').on('hide.bs.collapse', function (ev) {
            $('[data-target="#'+ev.target.id+'"]').toggleClass('opened');
        });
    };

    self.setInfowindowContent = function(place) {
        self.currentPlace(place);
        self.infoWindow.setContent($('#infowindow')[0].innerHTML);
    };

    self.destroyPlace = function(place,e) {
        // Remove the element
        var placesArray = self.places;
        var removedPlacesArray = placesArray.splice(placesArray.indexOf(place),1);
    };

    self.explorePlace = function (place) {
        // In case another place is currently shown
        self.showPlace(place);

        if (self.foursquare) {
            self.foursquare.searchVenueAtPosition(place.position,
                /* limit results to */ 5,
                function(results, status, errMsg) {
                    if (status === 200) {
                    place.addVenues(results);
                    self.storePlaces();
                } else {
                    ErrorMsg.showError("Foursquare call failed with status " + status + ": " + errMsg);
                }
            });
        } else {
            Foursquare.showMissingCredentialsError();
        }
    };

    self.promoteVenue = function (venue) {
        var place = new Place();
        place.title(venue.name);
        place.position = {
            lat: venue.location.lat,
            lng: venue.location.lng
        };
        place.formatted_address(venue.location.formattedAddress);

        // TODO(feat): Extract street number and street name.
        // Street number and street name are not available as explicit fields from fourSquare (just one joint
        // 'location.address' field).
        // It might be possible to extract them from the given data, but their position in the string is locale-specific.
        //
        // Probably its better to use the reverse Geocoder with lat/lng to retrieve them (or validate against).
        // In any event, I don't need them for now and can just rely on the formatted address.

        place.categories(venue.categories);

        self.places.push(place);
        self.showPlace(place);
        console.log(venue);
    };

    self.editPlace = function (place) {
        place.editing(true);
        // TODO: Save *all* place information, not just the title
        place.previousTitle = place.title();
    };

    // stop editing a place.  Remove it, if its title is now empty
    self.saveEditing = function (place) {
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
        // observable. TODO: Should I make it an observable? Why? Why not?
        self.setInfowindowContent(place);

        if (!trimmedTitle) {
            self.destroyPlace(place);
        }

        self.storePlaces();
    }.bind(this); // ensure that "this" is always this view model

    // cancel editing a marker and revert it to the previous content
    self.cancelEditing = function (place) {
        place.editing(false);
        place.title(place.previousTitle);
    };

    self.addPlace = function(geocoder, position, map) {
        var place = new Place(position);

        // Initialize formatted_address and title
        // See example at https://developers.google.com/maps/documentation/javascript/geocoding
        geocoder.geocode({'location': position}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    // Convert formatted address into an array, for more flexible formatting
                    // (Foursquare already returns such an array.)
                    // We assume that the comma is a separator character and does not appear anywhere else
                    // in the returned formatted address
                    place.formatted_address(results[0].formatted_address.split(',').map(function (el) {
                        return el.trim();
                    }));

                    // TODO(refactor): The Geocoder provides a "types" array which would allow to dynamically
                    // map to the address_components indices, for increased robustness
                    place.address = {
                        street: {
                            number: results[0].address_components[0].long_name,
                            name:  results[0].address_components[1].long_name
                        },
                        sublocality: results[0].address_components[2].long_name,
                        city:  results[0].address_components[3].long_name, /* Geocoder type: locality */
                        administrative_area: results[0].address_components[4].long_name,
                        country: results[0].address_components[5].long_name,
                        postalCode: results[0].address_components[6].long_name
                    };
                    // TODO(feat): Locale-specific formatting of street name and street number
                    place.title(place.address.street.name + ' ' + place.address.street.number);
                } else {
                    place.formatted_address = 'unknown (GeoCoder lookup did not return a result)';
                    place.title('unknown');
                }
            } else {
                place.formatted_address = 'unknown (Geocoder failed due to ' + status + ')';
                place.title('unknown');
            }
            self.storePlaces();
            self.setInfowindowContent(place);
        });

        self.places.push(place);

        self.displayInfowindow(place);
    };

    self.displayInfowindow = function(place) {
        var gMarker = self.lookupMarkerFromPlace(place);
        if (gMarker) {
            // Briefly display the result
            self.openInfowindow(gMarker);
            window.setTimeout(function() {
                self.closeInfoWindow();
            }, 1500);

        } else {
            // This should never happen
            console.warn("Marker not found (has the place's subscription already run?), cannot display.");
        }
    };

    self.loadPlaces = function() {
        if (store.enabled) {
            var placeStorage = store.get('places');
            if (placeStorage) {
                var placeArray = JSON.parse(placeStorage);
                placeArray.forEach(function (p) {
                    var place = new Place();
                    place.title(p.title);
                    place.position = p.position;
                    place.formatted_address(p.formatted_address);
                    place.categories(p.categories);
                    place.address = p.address;
                    place.venues(p.venues);
                    self.places.push(place);
                });
            }
        }
    };

    self.storePlaces = function() {
        if (store.enabled) {
            // http://knockoutjs.com/documentation/json-data.html
            store.set('places',ko.toJSON(self.places));
        }
    };

    self.bounceMarker = function(gMarker) {
        gMarker.setAnimation(google.maps.Animation.BOUNCE);
        window.setTimeout(function() {
            gMarker.setAnimation(null);
        }, 1400); // http://stackoverflow.com/questions/7339200/bounce-a-pin-in-google-maps-once
    };

    self.lookupPlaceFromMarker = function(gMarker) {
        return self.places().filter(function (place) {
            return place.id === gMarker.id;
        })[0];
    };

    self.openInfowindow = function(gMarker) {
        self.setInfowindowContent(self.lookupPlaceFromMarker(gMarker));
        self.infoWindow.open(gMarker.get('map'), gMarker);
    };

    self.closeInfoWindow = function() {
        self.infoWindow.close();
    };

    self.showPlace = function(place) {
        var gMarker = self.lookupMarkerFromPlace(place);
        gMarker.getMap().panTo(gMarker.getPosition());
        self.openInfowindow(gMarker);
        self.bounceMarker(gMarker);
    };

    self.initialize();
};

/* See https://developer.mozilla.org/en-US/docs/Online_and_offline_events */
window.addEventListener('load', function() {
    function updateOnlineStatus(event) {
        var condition = navigator.onLine ? 'online' : 'offline';
        var status=document.getElementById('connection-lost-warning');
        if (navigator.onLine) {
            status.classList.add('hidden');
        } else {
            status.classList.remove('hidden');
        }
    }

    window.addEventListener('online',  updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
});

window.onload = loadScript;
