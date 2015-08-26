# Neighborhood Map
A project from Udacity's Front-end Web Developer Nano degree.

It can be used to create a neighborhood map like the following:

<img src="https://github.com/andreaswachowski/udacity-frontend-p5-neighborhood-map/blob/master/screenshot.png" height=auto width="100%">

After centering/zooming the
map to the desired area (it is initially set to an area in Hamburg, Germany),
click on the map to create markers. The clicked places will be displayed in a
list shown on top of the map.

You can edit the title of a location by double-clicking on the corresponding
list entry (or clicking its edit button). A single click pans to the selected
marker.

# Installation
Clone the repository and open `app/index.html`. 

(You could also run `grunt`, but so far all it does is to copy the relevant files
into a `dist` directory.)

## Enabling the FourSquare API
To enable foursquare API access, you need a foursquare client id and client
secret (see [Connecting to the FourSquare
API](https://developer.foursquare.com/overview/auth)). Use those to
initialize `FOURSQUARE_CLIENT_ID` and `FOURSQUARE_CLIENT_SECRET` at the top
of `app/js/app.js`.

## Developer Documentation
* Call [grunt](http://gruntjs.com/getting-started) (assumes grunt-cli is already installed):
  1. Change to the project's root directory
  2. Run `npm install`
  3. Run Grunt with `grunt`

JSDoc documentation will be generated in `doc` (under the project's root
directory, ie not in `dist`).

# Resources
* [todomvc](https://github.com/tastejs/todomvc/tree/gh-pages) for the marker list
* [Google Maps APIs](https://developers.google.com/maps/)
* [Offline.js](http://github.hubspot.com/offline/docs/welcome/)

# Remarks:
* No attempt is being made at making the project work across older
  browsers. For example, the CSS is not using any specific browser prefixes
  (for that, I would employ
  [grunt-autoprefixer](https://github.com/nDmitry/grunt-autoprefixer)).
* CSS is intentionally on the light side, so no Bootstrap or Foundation.
