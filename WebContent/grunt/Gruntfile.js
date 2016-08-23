module.exports = function(grunt) {

	grunt.initConfig({

		//switch between the prod and dev enviroment
		dev_prod_switch: {
			options: {
				// Can be ran as `grunt --env=dev` or ``grunt --env=prod``
				environment: grunt.option('env') || 'dev', // 'prod' or 'dev'
				env_char: '#',
				env_block_dev: 'env:dev',
				env_block_prod: 'env:prod'
			},
			dynamic_mappings: {
				files: [{
					expand: true,
					cwd: './',
					src: ['../new_index.html'],
					dest: './'
				}]
			}
		},

		//concat all the .css files
		concat_css: {
			all: {
				src: [
					"../css/bootstrap.css",
					"../css/new_style.css"
				],
				dest: "../css/deployCss/styles.css"
			}
		},

		//minify all the .css files
		cssmin: {
			combine: {
				files: {
					'../css/styles.min.css': ['../css/deployCss/styles.css']
				}
			}
		},

		//concat all the .js files
		concat: {
			js: {
				src: [
					'../js/MWU-1.0.0.js',
					'../js/MWL-1.0.0.js',
					'../js/jquery-1.10.2.js',
					'../js/keynavigator.js',
					'../js/underscore-min.js',
					'../js/jquery-ui-1.10.4.min.js',
					'../js/bootstrap.min.js',
					'../js/jquery.velocity.min.js',
					'../js/ndvrRecord.js',
					'../js/ndvrInfoItem.js',
					'../js/ndvrSeries.js',
					'../js/ndvrManager.js',
					'../js/new_main.js'
				],
				dest: '../js/app.js',
				options: {
					separator: ';'
				}
			}
		},

		//minify and uglify all the .js files
		uglify: {
			js: {
				src: '../js/app.js',
				dest: '../js/app.min.js'
			}
		},

		// Before generating any new files, remove any previously-created files.
		clean: {
			options: { force: true },//
			files: ['../../war/*']
		}

//		war: {
//			target: {
//				options: {
//					war_dist_folder: '../../war',
//					war_verbose: true,
//					war_name: 'MoxiNdvr'
//				},
//				files: [
//					{
//						expand: true,
//						cwd: '../../',
//						src: [
//							'WebContent/**',
//							'src/**'
//						],
//						dest: ''
//					}
//				]
//			}
//		}

	});

	/**
	 * cmd commands :
	 * (standing on  the same folder as the Gruntfile.js is)
	 *
	 * grunt  --> executes all the tasks (warning: "all the tasks" includes
	 * the "war" task that generates a new .war file)
	 *
	 * grunt + taskname --> execute one sigle task
	 * example:
	 * grunt clean --> execute only the clean task
	 * grunt war --> execute only the war task
	 *
	 * for changing the enviroment (development/production)
	 * grunt dev_prod_switch --env=prod or grunt dev_prod_switch --env=dev
	 */
	grunt.loadNpmTasks('grunt-concat-css');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-dev-prod-switch');
	grunt.loadNpmTasks('grunt-contrib-clean');
//	grunt.loadNpmTasks('grunt-war');

	grunt.registerTask('default',
		[
			'concat',
			'uglify',
			'concat_css',
			'cssmin',
			'dev_prod_switch',
			'clean'
		]);

};