'use strict';

var fs = require('fs');
var pg = require('pg');
var counter = require('./counter');
var db = require('./db');

module.exports = processFile;

function processFile(options, callback) {
    options = options || {};
    options.isInitial = options.initial || false;
    options.filename = options.filename || 'data/objects-latest.osc';
    options.pgURL = options.pgURL || process.env.OSM_COMMENTS_POSTGRES_URL || 'postgres://postgres@localhost/osm-comments';
    pg.connect(options.pgURL, function(err, client, done) {
        if (err) {
            return console.error('could not connect to postgres', err);
        }
        parseObjects(options, client, function() {
            done();
            if (callback) callback();
        });
    });
}

function parseObjects(options, client, callback) {
    counter(options, function(err, changes) {
        if (err) {
            console.log('change file parsing failed', err);
            return callback(err);
        }

        db.saveChanges(client, changes, callback);
    });
}