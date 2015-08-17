// This Gruntfile is obviously rudimentary. Its purpose is to manifest the
// general workflow. Minification, linting etc. can (and should!) be added later.
module.exports = function(grunt) {
    'use strict';

    require('jit-grunt')(grunt);

    grunt.initConfig({
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [ 'dist/*' ]
                }
                ]
            }
        },

        copy: {
            dist: {
                files: [{
                    expand: true,
                    dots: true,
                    cwd: 'app',
                    dest: 'dist',
                    src: [
                        '*.html',
                        'js/*.js',
                        'styles/*.css'
                    ]
                }]
            }
        },

        jsdoc: {
            dist: {
                src: [' app/js/app.js' ],
                jsdoc: './node_modules/.bin/jsdoc',
                options: {
                    destination: 'doc'
                }
            }
        }
    });

    grunt.registerTask('build', [
        'clean:dist',
        'jsdoc',
        'copy:dist'
    ]);

    grunt.registerTask('default', ['build']);
};
