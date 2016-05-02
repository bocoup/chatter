'use strict';

// babel gruntfile bootstrapper

require('babel-register');

module.exports = function(grunt) {
  module.exports.grunt = grunt;
  require('./Gruntfile.babel');
};
