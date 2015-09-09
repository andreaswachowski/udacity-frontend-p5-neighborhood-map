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

// This application only uses foursquare's userless API calls, therefore
// a client id and client secret are sufficient.
var FOURSQUARE_CLIENT_ID; /* Initialize this! */
var FOURSQUARE_CLIENT_SECRET; /* Initialize this! */

/**
 * Loads the google map code and bootstraps the application.
 * Called at window.onload, see end of file.
 */
function loadScript() {
    if (navigator.onLine) {
        $("nav").removeClass("hidden");
        $("#map-canvas").removeClass("hidden");

        $("#offline-on-load").addClass("hidden");
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp' +
        '&signed_in=true&callback=initialize';
        document.body.appendChild(script);
    } else {
        $("nav").addClass("hidden");
        $("#map-canvas").addClass("hidden");

        $("#offline-on-load").removeClass("hidden");
        setTimeout(loadScript, 3000);
    }
}

// See http://stackoverflow.com/questions/10480697/keep-bootstrap-dropdown-open-on-click
//$(document).delegate("ul.dropdown-menu [data-keep-open-on-click]", "click", function(e) {
//    e.stopPropagation();
//});

// Force the dropdown to open when the filter box is entered.
// This did not work with the native Bootstrap "open" class - the dropdown was opened for
// a split-second, then immediately closed afterwards, even though the focus was still
// inside the search field. I could not see why certain events where fired and why not,
// the custom class 'force-open' fixed the problem.
// $( ".tt-input" ).focusin(function() {
//     // $(".dropdown").addClass("open");
//     $("dropdown-toggle").trigger("click");
// });
//
// $(".tt-input").focusout(function() {
//     $(".dropdown").removeClass("open");
// });
//
/*
$(function() {
    $("ul.dropdown-menu").on("click", "[data-keep-open-on-click]", function(e) {
        e.stopPropagation();
    });
});
*/

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
        center: { lat: 53.562261, lng: 9.961613 },
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
var Place = function(map,position) {
    this.title = ko.observable("");
    this.position = {
        lat: position.lat(),
        lng: position.lng()
    };
    this.formatted_address = "";
    this.street_number = "";
    this.street_name = "";
    this.editing = ko.observable(false);
    this.marker = new google.maps.Marker({
        position: position,
        map: map
    });
    this.venues = ko.observableArray();
    this.fourSquareLookupError = ko.observable();
    this.infowindow = new google.maps.InfoWindow();
};

/**
 * Augments the Place object with foursquare venues.
 * @param {Array} venues - An array of foursquare compact venues, as returned by the FourSquare venue search API
 * @see {@link https://developer.foursquare.com/docs/responses/venue}
 */
Place.prototype.addVenues = function(venues,viewModel) {
    // Extract just the information we need from the foursquare object
    // and assign it to the Place's venues property (which is a
    // ko.observableArray).
    this.venues(venues.map(function (e) {
        return {
            id: e.id,
            name: e.name,
            categories: e.categories.map(function (c) {
                return { name: c.name };
            })
        };
    }));
};

// TODO: It would be much (!) nicer to keep this HTML in index.html.
// Can I use knockout templates? (I think I would have to, because
// there might be multiple info windows shown. But how do I bind to
// the various places?
// var str='<div data-bind="template: { name: \'infowindow-template\', data: place }"></div>';
//
// TODO: In addition, anytime an observable changes, I manually have to
// call (ie not forget to call!) setInfowindowContent. It is not possible
// to make the infowindow HTML a ko.computed() and assign it to the
// content of the infowindow - Google expects a String and would return an
// error.
Place.prototype.setInfowindowContent = function() {
    var str = '<h3>'+this.title() + '</h3>' +
        '<div>'+this.formatted_address + '</div>';

    if (this.venues().length > 0) {
        str += '<h4>In the vicinity</h4>';
        str += '<ul>';
        this.venues().forEach(function(v, index, array) {
            str += '<li>' + v.name;
            var categoryStr = v.categories.map(function(c) {
                return c.name;
            }).join();
            if (categoryStr !== "") {
                str += " (" + categoryStr + ")";
            }
            str += "</li>";
        });
        str += "</ul>";
    } else /* silently ignore missing information, but show a warning */ if (this.fourSquareLookupError()) {
        str += '<p>' + this.fourSquareLookupError() + '</p>';
    }
    this.infowindow.setContent(str);
};

/**
 * @class FourSquare
 *
 * Constructs a FourSquare api object. This object is currently
 * only intended for userless access.
 * @constructor
 * @param {String} clientId - The foursquare API client id
 * @param {String} clientSecret - The foursquare API client secret
 */
var FourSquare = function(clientId, clientSecret) {
    this.baseUrl = "https://api.foursquare.com/v2";
    this.apiVersion = "20150824";

    this.clientId = clientId;
    this.clientSecret = clientSecret;
};

FourSquare.prototype.validApiCredentials = function() {
    var validCredentials = this.clientId && this.clientSecret;
    if (!validCredentials) {
        console.warn("No valid foursquare API credentials provided. FourSquare API calls won't be made. To fix, initialize FOURSQUARE_CLIENT_ID and FOURSQUARE_CLIENT_SECRET in app.js appropriately.");
    }
    return validCredentials;
};

/**
 * Given a location, search foursquare for the most likely venues at that
 * location.
 * @param {LatLngLiteral} position - The position of the venue.
 * @param {Number} limit - The maximum number of venues returned
 * @param {function} callback - A function with two parameters, result and status, that handles the response
 * @see {@link https://developer.foursquare.com/docs/venues/search}
 */
FourSquare.prototype.searchVenueAtPosition = function(position, limit, callback) {
    // Note: With more FourSquare methods, we would not want to remember to
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
            if(xmlhttp.status == 200) {
                // TODO From a security viewpoint, I suppose that using
                // eval() boils down to trusting the FourSquare servers
                // The API returns an array called "venues"
                venues = eval("("+xmlhttp.responseText+")").response.venues;
            }
            callback(venues,xmlhttp.status);
        }
    };

    var url = this.baseUrl + "/venues/search?ll=" + position.lat + "," + position.lng +
        "&limit=" + limit +
        this.apiCallPostFix();
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
};

FourSquare.prototype.apiCallPostFix = function() {
    return "&client_id=" + this.clientId +
        "&client_secret=" + this.clientSecret +
        "&v=" + this.apiVersion;
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

    self.initialize = function() {
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

        google.maps.event.addListener(map, 'click', function(e) {
            // An infowindow might be open when for example a place in
            // the marker list was clicked. Unless we close that window
            // here, it would remain open (unless manually closed later) in
            // addition to the window pertaining to the newly set marker.
            self.closeInfoWindows();
            self.addPlace(geocoder, e.latLng, map);
        });


        self.panToMatchIfUnique = function() {
            var searchFieldText = $(".tt-input").val();
            // TODO(refactor): The matching algorithm is coded twice, once in the substringMatcher, and once here. So if
            // we want to change it, we have to do it in two places. Merge this.
            var substrRegex = new RegExp(searchFieldText, 'i');
            var matchingPlaces = model.places.filter(function(e) {
                return substrRegex.test(e.title());
            });
            if (matchingPlaces.length === 1) {
                self.showPlace(matchingPlaces[0]);
                // Clear the text field so subsequent actions, like choosing a marker from the dropdown,
                // will not lead to confusion
                $(".searchclear").addClass("hidden");
                $(".typeahead").typeahead("val", "");
                $(".tt-input").blur().val("");
            }
            // else ignore
            // TODO(feat): This condition could trigger a warning, like a wobble effect or a red flash,
            // to show the user that too many places are selected
        };

        $(".searchclear").click(function() {
            // TODO(refactor): How can I address the searchclear-elementset implicitly, without having to specify it again?
            // "this" does not work, neither referring to a passed-in function argument
            $(".searchclear").addClass("hidden");
            $(".typeahead").typeahead("val", "");
            $(".tt-input").val("").focus();
        });

        $(".btn").click(function(e) {
            self.panToMatchIfUnique();
        });

        $(".tt-input").keyup(function(e) {
            // console.log(e.type + " on " + e.target.id);
            if ($(".tt-input").val() === "") {
                $(".searchclear").addClass("hidden");
            } else {
                $(".searchclear").removeClass("hidden");
            }
            var code = e.which;
            if (code === ENTER_KEY) {
                self.panToMatchIfUnique();
            }
        });
    };

    self.destroyPlace = function(place) {
        var placesArray = self.places;
        var removedPlacesArray = placesArray.splice(placesArray.indexOf(place),1);
        removedPlacesArray[0].marker.setMap(null); // remove marker from Google Map
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
        // observable. TODO: Should I make it one? Why? Why not?
        place.setInfowindowContent();

        if (!trimmedTitle) {
            this.destroyPlace(place);
        }
    }.bind(this); // ensure that "this" is always this view model

    // cancel editing a marker and revert it to the previous content
    self.cancelEditing = function (place) {
        place.editing(false);
        place.title(place.previousTitle);
    };

    self.addPlace = function(geocoder, position, map) {
        var place = new Place(map,position),
            gMarker = place.marker,
            positionLiteral = { lat: position.lat(), lng: position.lng() };

        // Initialize formatted_address and title
        // See example at https://developers.google.com/maps/documentation/javascript/geocoding
        geocoder.geocode({'location': position}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    // TODO: There is usually a *lot* more that can be
                    // extracted from the results.
                    place.formatted_address = results[0].formatted_address;
                    place.street_number = results[0].address_components[0].long_name;
                    place.street_name = results[0].address_components[1].long_name;
                    // Note: The order of street name and street number in the initial title assignment should in fact be
                    // locale-dependent.
                    place.title(place.street_name + ' ' + place.street_number);
                } else {
                    place.formatted_address = 'unknown (GeoCoder lookup did not return a result)';
                    place.title('unknown');
                }
            } else {
                place.formatted_address = 'unknown (Geocoder failed due to ' + status + ')';
                place.title('unknown');
            }
            place.setInfowindowContent();
        });

        var fourSquare = new FourSquare(FOURSQUARE_CLIENT_ID, FOURSQUARE_CLIENT_SECRET);

        fourSquare.searchVenueAtPosition(positionLiteral,
            /* limit results to */ 3,
            function(results, status) {
                if (status === 200) {
                console.log(results);
                place.addVenues(results);
                place.setInfowindowContent();
            } else {
                place.fourSquareLookupError("FourSquare call failed with status " + status);
                console.warn(place.fourSquareLookupError());
                place.setInfowindowContent();
            }
        });

        self.places.push(place);

        // Scroll to bottom of list. When the list overflows and a
        // vertical scrollbar appears, this helps understanding that new
        // places are indeed added.
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

    self.closeInfoWindows = function() {
        // Close any open infowindows. Actually, it should at most one be open.
        self.places().forEach(function (currentValue, index, array) {
            currentValue.infowindow.close();
        });
    };

    /* showMarker is executed when the user single-clicks on an entry in
     * the marker list
     */
    self.showPlace = function(place) {
        var gMarker = place.marker;
        gMarker.getMap().panTo(gMarker.getPosition());
        self.closeInfoWindows();
        place.infowindow.open(gMarker.get('map'), gMarker);
    };

    self.initialize();
};

/* See https://developer.mozilla.org/en-US/docs/Online_and_offline_events */
window.addEventListener('load', function() {
    function updateOnlineStatus(event) {
        var condition = navigator.onLine ? "online" : "offline";
        var status=document.getElementById('connection-lost-warning');
        if (navigator.onLine) {
            status.classList.add("hidden");
        } else {
            status.classList.remove("hidden");
        }
    }

    window.addEventListener('online',  updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
});

window.onload = loadScript;
