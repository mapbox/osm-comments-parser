'use strict';

var notesParser = require('./notes/index');
var changesetParser = require('./changesets/index');
var queue = require('queue-async');
var request = require('request');
var fs = require('fs');
var zlib = require('zlib');

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
module.exports.parseChangesets = parseChangesets;

module.exports.parseURL = parseURL;

module.exports.getURL = getURL;

function parseChangesets(options, callback) {
    changesetParser(options, callback);
}

module.exports.backfillChangesets = function(start, end, callback) {
    var baseURL = 'http://planet.osm.org/replication/changesets/';
    var urls = [];
    for (var i = start; i < (end + 1); i++) {
        urls.push(getURL(baseURL, i));
    }
    var q = queue(8);
    urls.forEach(function(url) {
        q.defer(parseURL, url);
    });
    q.awaitAll(function() {
        console.log('all backfilling done');
        if (callback) callback();
    });

    return;
};

/*
    Parses a changeset file at url
    @param {String} URL of gzipped changeset file
    @param {doneCallback} callback to call when done
*/
function parseURL(url, callback) {
    var filename = '/tmp/' + url.split('/').slice(-1)[0].replace('.gz', '');
    request.get(url)
        .pipe(zlib.createGunzip())
        .pipe(fs.createWriteStream(filename))
        .on('finish', function() {
            parseChangesets({
                'filename': filename
            }, function() {
                console.log('parsed changesets: ' + filename);
                callback();
            });

        });
}


function getURL(baseURL, number) {
    var stateStr = number.toString().split('').reverse();
    var diff = 9 - stateStr.length;
    for (var i = 0; i < diff; i++) { stateStr.push('0'); }
    stateStr = stateStr.join('');
    var url = '';
    for (i = 0; i < (stateStr.length / 3); i++) {
        url += stateStr[i * 3] + stateStr[i * 3 + 1] + stateStr[i * 3 + 2] + '/';
    }

    return baseURL + url.split('').reverse().join('') + '.osm.gz';
}
