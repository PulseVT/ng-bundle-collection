module.exports = (grunt) ->

	_ = require './node_modules/lodash/index.js'
	modrewrite = require 'connect-modrewrite'
	serveStatic = require 'serve-static'

	require('load-grunt-tasks') grunt

	grunt.initConfig
		config:
			examples: 'examples'
			docs: 'docs'
			src: 'src'
			dist: 'dist'

		connect:
			examples:
				options:
					port: 9000
					base: '<%= config.examples %>'
					debug: yes
					middleware: (connect, options) ->
						[
							modrewrite [ '!(\\..+)$ /example.html [L]' ]
							serveStatic '.'
							serveStatic options.base.toString()
						]
			docs:
				options:
					port: 9001
					static: '<%= config.docs %>'
					middleware: (connect, options) ->
						[
							modrewrite ['!\\.ttf|\\.woff|\\.ttf|\\.eot|\\.html|\\.js|\\.css|\\.png|\\.jpg|\\.gif|\\.svg$ /index.html [L]']
							serveStatic options.static.toString()
						]



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
			docs:
				files: ['<%= config.dist %>/**/*.js']
				tasks: ['docs:serve']

		coffee:
			main:
				options:
					bare: yes
				files:
					'<%= config.dist %>/ng-bundle-collection.js': ['<%= config.src %>/*.coffee']
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

		clean:
			docs: ['<%= ngdocs.options.dest %>']
			dist: ['<%= config.dist %>']

		ngdocs:
			options:
				dest: 'docs'
				html5Mode: yes
			main:
				src: ['<%= config.dist %>/**/*.js']
				title: 'Documentation'

	grunt.registerTask 'docs', (target) ->
		tasks = []
		if 'serve' isnt target
			tasks.push 'clean:docs'
		grunt.task.run tasks.concat [
			'build'
			'ngdocs:main'
		]

	grunt.registerTask 'build', [
		'coffee:main'
	]

	grunt.registerTask 'build-examples', [
		'coffee:examples'
	]

	grunt.registerTask 'serve-examples', [
		'clean:dist'
		'bower-install-simple'
		'build-examples'
		'build'
		'connect:examples'
		'watch'
	]

	grunt.registerTask 'serve-docs', [
		'docs:serve'
		'connect:docs'
		'watch'
	]

	grunt.registerTask 'serve', [
		'clean:dist'
		'bower-install-simple'
		'build-examples'
		'build'
		'connect:examples'
		'docs:serve'
		'connect:docs'
		'watch'	
	]

	grunt.registerTask 'default', ['serve']