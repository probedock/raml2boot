var raml2boot = require('./lib');

module.exports = function(grunt) {

  grunt.initConfig({
    bump: {
      options: {
        files: [ 'package.json' ],
        commit: false,
        createTag: false,
        push: false
      }
    },

    clean: {
      pages: [ 'tmp/pages/**/*' ]
    },

    'gh-pages': {
      options: {
        base: 'tmp/pages'
      },
      src: ['**']
    },

    jshint: {
      files: [ 'Gruntfile.js', 'lib/**/*.js' ]
    },

    watch: {
      examples: {
        files: [ 'examples/**/*.raml', 'examples/**/*.jade', 'lib/**/*.js', 'templates/**/*' ],
        tasks: [ 'examples' ],
        options: {
          atBegin: true,
          livereload: true
        }
      }
    }
  });

  grunt.registerTask('examples', 'Convert examples/api.raml to examples/api.html', function() {
    var done = this.async();
    raml2boot({ source: 'examples/api.raml', output: 'examples/api.html', livereload: true }).then(done);
  });

  grunt.registerTask('convertForPages', 'Convert examples/api.raml for GitHub Pages', function() {
    var done = this.async();
    raml2boot({ source: 'examples/api.raml', output: 'tmp/pages/index.html' }).then(done);
  });

  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-gh-pages');

  grunt.registerTask('default', [ 'jshint' ]);
  grunt.registerTask('pages', [ 'clean:pages', 'convertForPages', 'gh-pages' ]);
};
