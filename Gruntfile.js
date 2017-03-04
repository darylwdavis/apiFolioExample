


module.exports = function(grunt) {
  var buildPath='build/<%= pkg.name %>.min.js';
  var pkg = require('./package.json');



    // config.name = pkg.name;
    // config.version = pkg.version;

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    
    strip_code: {
      options: {
        blocks: [
          {
              start_block: "/* test-code */",
              end_block: "/* end-test-code */"
          }
        ] 
      },
      your_target: {
        files:[
            {
              // a list of files you want to strip code from
              src: "src/DWDmongoDB/kmc-commander*.js",
              dest: "stripped/kmc-commander-gui.js"
            }
        ]
      }
    },

	'json-minify': {
	  build: {
	    files: 'build/**/*.json'
	  }
	},

    jshint: {
       'kmc*.js files': ['src/getHistory.js','src/cmdrUtil.js','src/config.js']
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/DWDmongoDB/<%= pkg.name %>.js',
        dest: buildPath
      }
    },

    concat: {
      options: {
        separator: ';\n',
      },
      dist: {
        src: ['src/DWDmongoDB/a.js', 'src/DWDmongoDB/b.js'],
        dest: 'dist/<%= pkg.name %>.js',
      },
    },

    watch: {
      js: {
        files: '<%= uglify.build.src %>',
        tasks: ['uglify']
      }
    },


    nodeunit: {
      tests: ['test/*_test.js']
    },

    execute: {
        module_target: {
           options: {
            module: true
           },
           src: ['main.js']
        }
    },

    copy: {
      'pub-to-dist': {
        expand: true,
        cwd: 'pub/kmccm/',
        src: '**/*',
        dest: 'dist/pub/kmccm',
      },
    },

    'string-replace': {
        version: {
          files: [{
                  expand: true,
                  cwd: 'dist/pub/kmccm/',
                  src: ['site.js','kmc*.js'],
                  dest: 'dist/pub/kmccm/'
           }],
          options: {
            replacements: [{
              pattern: /{{ VERSION }}/,
              replacement: "v"+pkg.version
            }]
          }
      },
    },

    zip: {
        'installer-UI': {
           cwd: 'dist/',
           src: 'dist/pub/kmccm/**/*',
           dest: 'dist/ui-'+'<%= gitinfo.local.branch.current.name %>'+'-'+pkg.version+'.zip',
        },
    },
  });


  grunt.loadNpmTasks('grunt-gitinfo');
  grunt.loadNpmTasks('grunt-git-release');
  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-string-replace');
  grunt.loadNpmTasks('grunt-zip');

  grunt.registerTask('stringReplace','string-replace')
  grunt.registerTask('stripCode', [
    'strip_code',
  ]);
  grunt.registerTask('default', [
    'uglify',
    ]);

  grunt.registerTask('json-minify', [
    'json-minify',
    ]);
  grunt.registerTask('dev', [
    'watch'
    ]);

  grunt.registerTask("nodeunit", [
    "nodeunit"
  ]);

  grunt.registerTask("releasePackage", 'Increment Git Version.', function(level) {
      //Default will incr rev. level can be minor or major
      if (level==undefined) {level="" }else{level=':'+level;}
      grunt.task.run('release'+level);
      grunt.task.run('package');
  });

  grunt.registerTask("package", [
    "gitinfo",
    "jshint",
    "copy",
    "string-replace",
    "zip",
  ]);

  grunt.registerTask('test', ['copy', 'json-minify', 'nodeunit']);

  grunt.registerTask('printConfig', function() {
         grunt.log.writeln(JSON.stringify(grunt.config(), null, 2));
  });
};
