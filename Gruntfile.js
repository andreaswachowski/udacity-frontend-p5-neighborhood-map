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
        }

    });

    grunt.registerTask('build', [
        'clean:dist',
        'copy:dist'
    ]);

    grunt.registerTask('default', ['build']);
};
