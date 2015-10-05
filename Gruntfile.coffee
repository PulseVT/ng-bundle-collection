module.exports = (grunt) ->

	require('load-grunt-tasks') grunt

	grunt.initConfig
		config:
			examples: 'examples'
			src: 'src'
			dist: 'dist'

		watch:

		coffee:
			examples:
				expand: yes
				flatten: yes
				cwd: '<%= config.examples %>'
				src: ['*.coffee']
				dest: ['js']
				ext: '.js'