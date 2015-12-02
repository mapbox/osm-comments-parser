'use strict';

var notesParser = require('./notes/index');
var changesetParser = require('./changesets/index');

module.exports = {};

/**
    Processes an XML file with <note> entries and dumps them
    into a postgres database.

    @param {Object} options Options object
    @param {string} options.filename Path to XML file
    @param {string} options.pgURL Postgres URL, like 'postgres://postgres@localhost/osm-comments'
    @param {processDoneCallback} callback called after file is done processing

    @callback processDoneCallback

    @returns {undefined}

*/
module.exports.parseNotes = function(options, callback) {
    notesParser(options, callback);
};


/**
    Processes an XML file with <changeset> entries and dumps them
    into a postgres database.

    @param {Object} options Options object
    @param {string} options.filename Path to XML file
    @param {string} options.pgURL Postgres URL, like 'postgres://postgres@localhost/osm-comments'
    @param {processDoneCallback} callback called after file is done processing

    @callback processDoneCallback

    @returns {undefined}
*/
module.exports.parseChangesets = function(options, callback) {
    changesetParser(options, callback);
};
