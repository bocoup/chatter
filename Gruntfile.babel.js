import 'source-map-support/register';
import {grunt} from './Gruntfile';

const negate = p => `!${p}`;
const exclude = a => Array.isArray(a) ? a.map(negate) : negate(a);

const SOURCE_DIR = 'src';
const SOURCE_GLOB = '**/*.js';
const TEST_GLOB = '**/*.test.js';
const BUILD_DIR = 'lib';

const BUILD_FILES = ['*.js', 'tools/**/*.js'];
const LEGACY_BUILD_FILES = ['Gruntfile.js'];
const LINT_FILES = ['.eslintrc*', 'eslint/**/*'];
const TEST_FILES = [`${SOURCE_DIR}/${TEST_GLOB}`];
const SRC_FILES = [`${SOURCE_DIR}/${SOURCE_GLOB}`, ...exclude(TEST_FILES)];

const babel = {
  build: {
    expand: true,
    cwd: SOURCE_DIR,
    src: [SOURCE_GLOB, exclude(TEST_GLOB)],
    dest: BUILD_DIR,
  },
};

const clean = {
  build: BUILD_DIR,
};

const watch = {
  src: {
    files: SRC_FILES,
    tasks: ['eslint:src', 'mochaTest', 'build'],
  },
  test: {
    files: TEST_FILES,
    tasks: ['eslint:test', 'mochaTest'],
  },
  build: {
    options: {reload: true},
    files: [...BUILD_FILES, ...LEGACY_BUILD_FILES],
    tasks: ['eslint:build', 'eslint:legacy_build', 'mochaTest', 'build'],
  },
  lint: {
    options: {reload: true},
    files: LINT_FILES,
    tasks: ['eslint'],
  },
};

const eslint = {
  src: {
    options: {configFile: '.eslintrc-es2015.yaml'},
    src: SRC_FILES,
  },
  test: {
    options: {configFile: '.eslintrc-mocha.yaml'},
    src: TEST_FILES,
  },
  legacy_build: {
    options: {configFile: '.eslintrc-es5.yaml'},
    src: LEGACY_BUILD_FILES,
  },
  build: {
    options: {configFile: '.eslintrc-es2015.yaml'},
    src: [...BUILD_FILES, ...exclude(LEGACY_BUILD_FILES)],
  },
};

const mochaTest = {
  test: {
    options: {
      reporter: 'spec',
      quiet: false,
      clearRequireCache: true,
      require: [
        'babel-register',
        'tools/test-globals',
      ],
    },
    src: TEST_FILES,
  },
};

grunt.initConfig({
  clean,
  babel,
  eslint,
  mochaTest,
  watch,
});

grunt.registerTask('test', ['eslint', 'mochaTest']);
grunt.registerTask('build', ['clean', 'babel']);
grunt.registerTask('default', ['watch']);

grunt.loadNpmTasks('grunt-babel');
grunt.loadNpmTasks('grunt-contrib-clean');
grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-eslint');
grunt.loadNpmTasks('grunt-mocha-test');
