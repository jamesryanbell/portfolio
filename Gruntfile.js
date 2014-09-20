/* global module:false */
module.exports = function(grunt) {

	require('jit-grunt')(grunt);

	var globalConfig = {
		projectName: 'Template'
	};


	// Project configuration
	grunt.initConfig({

		globalConfig: globalConfig,

		/* ==========================================================================
		   IMAGES
		   ========================================================================== */
		imagemin: {
			dynamic: {
				files: [{
					expand: true,
					cwd: 'dist/css/',
					src: ['**/*.{png,jpg,gif}'],
					dest: 'dist/css'
				},
				{
					expand: true,
					cwd: 'dist/img/',
					src: ['**/*.{png,jpg,gif}'],
					dest: 'dist/img'
				},
				{
					expand: true,
					src: 'apple-touch-icon*.png',
					dest: ''
				}],
				options: {
					pngquant: true
				}
			}
		},

		svgmin: {
			options: {
				plugins: [
					{ removeViewBox: true },
					{ convertColors: false },
					{ convertPathData: false }
				]
			},
			dist: {
				files:[{
					expand: true,
					cwd: 'src/img',
					src: ['**/*.svg'],
					dest: 'dist/img',
					ext: '.svg'
				},
				{
					expand: true,
					cwd: 'src/css/',
					src: ['**/*.svg'],
					dest: 'dist/css',
					ext: '.svg'
				}]
			}
		},

		tinypng: {
			options: {
				apiKey: "ImzWe0bazMZmIVhaYODMDV3HBQFFvoWT",
				checkSigs: true,
				sigFile: 'src/file_sigs.json',
				summarize: true,
				showProgress: true,
				stopOnImageError: true
			},
			compress: {
				expand: true,
				cwd: 'src/img/',
				src: ['**/*.png'],
				dest: 'dist/img'
			}
		},

		/* ==========================================================================
		   SASS
		   ========================================================================== */
		sass: {
			options: {
				loadPath: [require('node-bourbon').includePaths, 'src/scss/_inc']
			},
			target: {
				files: [{
					expand: true,
					cwd: 'src/scss',
					src: ['**/*.scss'],
					dest: 'dist/css/',
					ext: '.css'
				}]
			}
		},

		_nodesass: {
			options: {
				includePaths: [require('node-bourbon').includePaths, 'src/scss/_inc'],
				sourceMap: true
			},
			target: {
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
				browsers: ['> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1', 'ios 6', 'ios 7'],
				map: true
			},
			files: {
				src: 'dist/css/**/*.css'
			}
		},

		concat: {
			css: {
				src: [
					'src/css/normalize.css',
					'src/css/plugins/**/*.css',
					'src/css/main.css',
					'src/css/media-queries/xs.css',
					'src/css/media-queries/s.css',
					'src/css/media-queries/m.css',
					'src/css/media-queries/l.css',
					'src/css/media-queries/xl.css'
				],
				dest: 'dist/css/css.css',
			},
			js: {
				src: [
					'src/js/plugins.js',
					'src/js/main.js'
				],
				dest: 'dist/js/js.js',
			}
		},

		cssmin: {
			compress: {
				files: {
					"dist/css/css.css": ["dist/css/css.css"]
				}
			}
		},

		/* ==========================================================================
		   JS
		   ========================================================================== */
		uglify: {
			js: {
				src: 'dist/js/js.js',
				dest: 'dist/js/js.js'
			}
		},

		jshint: {
			options: {
				reporter: require('jshint-stylish'),
				browser: true,
				globals: {
					jQuery: true
				}
			},
			all: ['Gruntfile.js', 'dist/js.js']
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

		/* ==========================================================================
		   UTILS
		   ========================================================================== */

		sync: {
			images: {
				expand: true,
				cwd: 'src/img/',
				src: ['**/*', '!**.ini'],
				dest: 'dist/img/'
			},
			css_images: {
				expand: true,
				cwd: 'src/css/i/',
				src: ['**/*', '!**.ini'],
				dest: 'dist/css/i/'
			}
		},

		clean: {
			css: {
				src: ["dist/css/**/*.css", "!dist/css/i/**/*", "!dist/css/fonts/**/*"]
			},
			js: {
				src:  ["dist/js/**/*.js", "!dist/js/vendor/**/*"]
			}
		},

		compress: {
			main: {
				options: {
					archive: 'exports/<%= globalConfig.projectName %>-' + grunt.template.today('yyyy-mm-dd-HHmmss') + '.zip'
				},
				files: [
					{ src: ['src/**/*', 'dist/**/*'] }
				]
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
			scripts: {
				files: ['src/js/**/*.js'],
				tasks: ['js'],
				options: {
					livereload: true
				}
			},
			// css: {
			// 	files: ['src/css/**/*.css'],
			// 	tasks: ['css'],
			// 	options: {
			// 		livereload: true
			// 	}
			// },
			scss: {
				files: ['src/scss/**/*.scss'],
				tasks: ['scss'],
				options: {
					livereload: true
				}
			},
			html: {
				files: ['src/pages/**/*.html', 'src/includes/**/*.html'],
				tasks: ['pages'],
				options: {
					livereload: true
				}
			},
			images: {
				files: ['src/img/**/*'],
				tasks: ['sync:images']
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
	//grunt.registerTask( 'css', ['clean:css', 'newer:concat:css', 'newer:autoprefixer'] );
	grunt.registerTask( 'scss', ['clean:css', 'newer:sass'] );
	grunt.registerTask( 'js', ['clean:js', 'newer:concat:js', 'newer:jshint'] );
	grunt.registerTask( 'pages', ['includes'] );
	grunt.registerTask( 'images', ['imagemin', 'tinypng', 'svgmin'] );

	grunt.registerTask( 'build', ['pages', 'scss', 'js', 'images'] );
	grunt.registerTask( 'deploy', ['build', 'compress'] );
};
