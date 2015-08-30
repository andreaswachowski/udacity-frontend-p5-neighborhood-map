// This Gruntfile is obviously rudimentary. Its purpose is to manifest the
// general workflow. Minification, linting etc. can (and should!) be added later.
module.exports = function(grunt) {
    'use strict';
    require('time-grunt')(grunt);

    require('jit-grunt')(grunt, {
        useminPrepare: 'grunt-usemin'
    });

    var config = {
        app: 'app',
        dist: 'dist'
    };


    grunt.initConfig({
        config: config,

        clean: {
            tmp: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp'
                    ]
                }
                ]
            },
            dist: {
                files: [{
                    dot: true,
                    src: [ '<%= config.dist %>/*' ]
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
                    dest: '<%= config.dist %>',
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
                src: ['<%= config.app %>/js/app.js' ],
                jsdoc: './node_modules/.bin/jsdoc',
                options: {
                    destination: 'doc'
                }
            }
        },

        // Compiles Sass to CSS and generates necessary files if requested
        sass: {
            options: {
                sourceMap: true,
                sourceMapEmbed: true,
                sourceMapContents: true,
                includePaths: ['.']
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= config.app %>/styles',
                    src: ['*.{scss,sass}'],
                    dest: '.tmp/styles',
                    ext: '.css'
                }]
            }
        },

        postcss: {
            options: {
                map: true,
                processors: [
                    // Add vendor prefixed styles
                    require('autoprefixer-core')({
                        browsers: ['> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1']
                    })
                ]
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: '.tmp/styles/',
                    src: '{,*/}*.css',
            dest: '.tmp/styles/'
                }]
            }
        },

        useminPrepare: {
            options: {
                dest: '<%= config.dist %>'
            },
            html: [ '<%= config.app %>/*.html' ],
            css: ['.tmp/styles/**/*.css']
        },

        usemin: {
            options: {
                assetsDirs: [
                    '<%= config.dist %>',
                    '<%= config.dist %>/styles'
                ]
            },
            html: ['<%= config.dist %>/{,*/}*.html'],
            css: ['<%= config.dist %>/styles/{,*/}*.css']
        },

        htmlmin: {
            dist: {
                options: {
                    collapseBooleanAttributes: true,
                    collapseWhitespace: true,
                    removeComments: true,
                    conservativeCollapse: true,
                    removeAttributeQuotes: true,
                    removeCommentsFromCDATA: true,
                },
                files: [{
                    expand: true,
                    cwd: '<%= config.dist %>',
                    src: '{,*/}*.html',
            dest: '<%= config.dist %>'
                }]
            },
        },

        // Automatically inject Bower components into the HTML file
        wiredep: {
            app: {
                src: ['<%= config.app %>/index.html'],
                exclude: ['bootstrap.js'],
                ignorePath: /^(\.\.\/)*\.\./
            },
            sass: {
                src: ['<%= config.app %>/styles/{,*/}*.{scss,sass}'],
            ignorePath: /^(\.\.\/)+/
            }
        },

        // Renames files for browser caching purposes
        filerev: {
            dist: {
                src: [
                    '<%= config.dist %>/js/{,*/}*.js',
            '<%= config.dist %>/styles/{,*/}*.css'
                ]
            }
        },

        watch: {
            configFiles: {
                files: [ 'Gruntfile.js' ],
                options: {
                    reload: true
                }
            },

            js: {
                files: ['<%= config.app %>/js/**/*.js'],
                tasks: ['jshint','uglify'],
                options: {
                    spawn: false,
                },
            },
        }
    });

    grunt.registerTask('build', [
        'clean:dist',
        'jsdoc',
        'sass',
        'wiredep',
        'useminPrepare',
        'postcss',
        'concat:generated', // generated by useminPrepare
        'cssmin:generated', // generated by useminPrepare
        'uglify:generated', // generated by useminPrepare
        'copy:dist',
        'filerev',
        'usemin',
        'htmlmin'
    ]);

    grunt.registerTask('default', ['build']);
};
