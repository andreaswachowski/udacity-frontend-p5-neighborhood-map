# Neighborhood Map
A project from Udacity's Front-end Web Developer Nano degree.

It can be used to create a neighborhood map like the following:

<img src="https://github.com/andreaswachowski/udacity-frontend-p5-neighborhood-map/blob/master/screenshot.png" height=auto width="100%">

After centering/zooming the
map to the desired area (it is initially set to an area in Hamburg, Germany),
click on the map to create markers. The markers are collected in the drop-down
list “places”. You can filter the places in the search field next to it.

Places can also be modified: Edit the title of a location by
double-clicking on the corresponding list entry (or clicking its edit
button).

A single click pans to the selected marker.

# Installation
* Clone the git repository to a local directory
* Call [grunt](http://gruntjs.com/getting-started) (assumes grunt-cli is already installed):
  1. Change to the project's root directory
  2. Run
```
    npm install
```

  3. Run Grunt with
```
grunt
```

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
* [todomvc](https://github.com/tastejs/todomvc/tree/gh-pages) for the marker list
* [Google Maps APIs](https://developers.google.com/maps/)
