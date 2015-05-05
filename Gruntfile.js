module.exports = function(grunt) {

  grunt.initConfig({
    bump: {
      options: {
        files: ['package.json'],
        commit: false,
        createTag: false,
        push: false
      }
    },

    jshint: {
      files: [ 'Gruntfile.js', 'lib/**/*.js' ]
    }
  });

  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', ['jshint']);
};
