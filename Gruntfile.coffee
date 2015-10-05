module.exports = (grunt) ->

	_ = require './node_modules/lodash/index.js'
	modrewrite = require 'connect-modrewrite'
	serveStatic = require 'serve-static'

	require('load-grunt-tasks') grunt

	grunt.initConfig
		config:
			examples: 'examples'
			src: 'src'
			dist: 'dist'

		connect:
			examples:
				options:
					port: 9000
					base: '<%= config.examples %>'
					debug: yes
					middleware: (connect, options) ->
						optBase = if _.isString options.base then [ options.base ] else options.base
						[
							modrewrite [ '!(\\..+)$ /example.html [L]' ]
							serveStatic '.'
						].concat optBase.map (path) ->
							serveStatic path

		watch:
			main_coffee:
				files: ['<%= config.src %>/**/*.coffee']
				tasks: ['build']
			examples_coffee:
				files: ['<%= config.examples %>**/*.coffee']
				tasks: ['build-examples']
			gruntfile:
				files: ['Gruntfile.coffee']
				tasks: ['build-examples', 'build']

		coffee:
			main:
				options:
					bare: yes
				files:
					'<%= config.dist %>/ng-bundle-collection.js': ['<%= config.src %>/scripts/*.coffee']
			examples:
				options:
					bare: yes
				expand: yes
				flatten: yes
				cwd: '<%= config.examples %>'
				src: ['*.coffee']
				dest: '<%= config.examples %>/js'
				ext: '.js'

		'bower-install-simple':
			options:
				color: yes
			main:
				options:
					cwd: '.'

	grunt.registerTask 'build', [
		'coffee:main'
	]

	grunt.registerTask 'build-examples', [
		'coffee:examples'
	]

	grunt.registerTask 'serve', [
		'bower-install-simple'
		'build-examples'
		'build'
		'connect'
		'watch'
	]

	grunt.registerTask 'default', ['serve']