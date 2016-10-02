/* global module:false */
module.exports = function(grunt) {

	require('jit-grunt')(grunt);

	// Project configuration
	grunt.initConfig({

		/* ==========================================================================
			 SASS
			 ========================================================================== */

		sass: {
			options: {
				includePaths: [require('node-bourbon').includePaths, 'src/scss/_inc'],
				sourceMap: true
			},
			dist: {
				files: [{
					expand: true,
					cwd: 'src/scss',
					src: ['**/*.scss'],
					dest: 'dist/css/',
					ext: '.css'
				}]
			}
		},

		/* ==========================================================================
			 CSS
			 ========================================================================== */
		autoprefixer: {
			options: {
				map: true
			},
			files: {
				src: 'dist/css/**/*.css'
			}
		},

		cssmin: {
			compress: {
				files: {
					"dist/css/tidy.min.css": ["dist/css/tidy.css"]
				}
			}
		},

		uncss: {
			dist: {
				files: {
					'dist/css/tidy.css': ['dist/index.html']
				}
			}
		},

		/* ==========================================================================
			 HTML
			 ========================================================================== */

		includes: {
			build: {
				cwd: 'src/pages/',
				src: ['**/*.html'],
				dest: 'dist/',
				options: {
					flatten: true,
					includePath: 'src/includes/'
				}
			}
		},

		replace: {
				dist: {
						options: {
								patterns: [
										{
												match: 'include_css_style_tag',
												replacement: '<%= grunt.file.read("dist/css/tidy.css") %>'
										}
								]
						},
						files: [
								{expand: true, flatten: true, src: ['dist/index.html'], dest: 'dist/'}
						]
				}
		},

		processhtml: {
				options: {
					// Task-specific options go here.
				},
				build: {
					files: {
						'dist/index.html': ['dist/index.html']
					}
				},
		},

		/* ==========================================================================
			 UTILS
			 ========================================================================== */

		clean: {
			css: {
				src: ["dist/css/**/*.css", "!dist/css/i/**/*", "!dist/css/fonts/**/*", "!dist/css/tidy.css"]
			},
			js: {
				src:  ["dist/js/**/*.js", "!dist/js/vendor/**/*"]
			}
		},

		/* ==========================================================================
			 WATCH
			 ========================================================================== */

		watch: {
			main: {
				files: ['Gruntfile.js'],
				tasks: 'default'
			},
			scss: {
				files: ['src/scss/**/*.scss'],
				tasks: ['scss'],
				options: {
					livereload: false
				}
			},
			html: {
				files: ['src/pages/**/*.html', 'src/includes/**/*.html'],
				tasks: ['pages'],
				options: {
					livereload: false
				}
			},
			css_images : {
				files: ['src/css/i/**/*'],
				tasks: ['sync:css_images']
			}
		}

	});

	grunt.loadNpmTasks('grunt-notify');

	// Default task
	grunt.registerTask( 'default', ['watch'] );
	grunt.registerTask( 'scss', ['includes', 'clean:css', 'sass', 'uncss', 'autoprefixer', 'cssmin', 'processhtml'] );
	grunt.registerTask( 'pages', ['includes'] );

	grunt.registerTask( 'build', ['pages', 'scss'] );
	grunt.registerTask( 'deploy', ['build'] );
};
