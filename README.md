# Neighborhood Map
A project from Udacity's Front-end Web Developer Nanodegree.

It can be used to create a neighborhood map like the following:

<img src="https://github.com/andreaswachowski/udacity-frontend-p5-neighborhood-map/blob/master/screenshot.png" height=auto width="100%">

During load, if the device supports geolocation, the map center can be
initialized to your location. You may further specify as default behavior
whether the map center shall be initialized to the current location, the
previously stored location, or the hardcoded default location.

Click on the map to create markers. Markers are reverse geocoded and the
corresponding places collected in the sidebar.

Explore the place by clicking on the magnifier glass, which is shown while
hovering over its entry in the sidebar (on mobile devices, the button is always
shown). Exploring will extend the place with five venues from the vicinity
found by Foursquare. You can promote those venues to a proper place by
clicking on their respective star icon.

Place titles can also be modified: Edit the title of a location by
double-clicking on the corresponding list entry (or clicking its edit
button).

A single click pans to the selected marker.

Filtering is done on the title and the category (ie not the address). Also
included is typeahead functionality, which can be seen in a dropdown below
the textfield when the sidebar is toggled off.

Places are persisted to localStorage for future use.

# Installation
* Clone the git repository to a local directory
* Enter your Foursquare API credentials in `app/js/app.js` (right at the top, you will see where in the file)
* Call [grunt](http://gruntjs.com/getting-started) (assumes grunt-cli is already installed):
  1. Change to the project's root directory
  2. Run `npm install`
  3. Run `bower install`
  4. Run Grunt with `grunt`

Afterwards, all relevant files can be found in the `dist` directory
(below the project's root directory), open `dist/index.html` to start.

JSDoc documentation will be generated in `doc` (under the project's root
directory, ie not in `dist`).

## Enabling the FourSquare API
To enable foursquare API access, you need a foursquare client id and client
secret (see [Connecting to the FourSquare
API](https://developer.foursquare.com/overview/auth)). Use those to
initialize `FOURSQUARE_CLIENT_ID` and `FOURSQUARE_CLIENT_SECRET` at the top
of `app/js/app.js`.

# Resources
* [Google Maps APIs](https://developers.google.com/maps/)
* [Bootstrap](http://getbootstrap.com/)
* [typeahead.js](https://twitter.github.io/typeahead.js/)
* [todomvc](https://github.com/tastejs/todomvc/tree/gh-pages)
