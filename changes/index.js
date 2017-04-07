'use strict';

var fs = require('fs');
var pg = require('pg');
var counter = require('./counter');
var db = require('./db');

module.exports = processFile;

// 'statefile' => 2121010
function extractReplicationId(path) {
    var stateFile = fs.readFileSync(path, 'utf8');
    var replicationId = stateFile.split('\n')[2];
    replicationId = replicationId.split('=')[1];
    replicationId = parseInt(replicationId, 10);
    if (Number.isNaN(replicationId)) {
        throw new Error('replication id is not a number');
    }
    return replicationId;
}
function processFile(options, callback) {
    if (!options.statefile) {
        throw new Error('state file was not provided');
    }
    options = options || {};
    options.isInitial = options.initial || false;
    options.filename = options.filename || 'data/objects-latest.osc';
    options.statefile = options.statefile;
    options.pgURL = options.pgURL || process.env.OSM_COMMENTS_POSTGRES_URL || 'postgres://postgres@localhost/osm-comments';
    options.replicationId = extractReplicationId(options.statefile);
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
