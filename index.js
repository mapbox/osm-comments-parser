'use strict';

var notesParser = require('./notes/index');
var changesetParser = require('./changesets/index');

module.exports = {};

module.exports.parseNotes = function(options, callback) {
    notesParser(options, callback);
};

module.exports.parseChangesets = function(options, callback) {
    changesetParser(options, callback);
};
