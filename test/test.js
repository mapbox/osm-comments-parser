'use strict';

var tape = require('tape');
var processNotes = require('../notes');
var processChangesets = require('../changesets');
var pg = require('pg');
var queue = require('queue-async');
var notesFirstRunQueries = require('./fixtures/notes-first-run-queries.json');
var changesetsFirstRunQueries = require('./fixtures/changesets-first-run-queries.json');
var TEST_PG_URL = process.env.OSM_COMMENTS_TEST_POSTGRES_URL || 'postgres://postgres@localhost/osm-comments-test';

tape('check notes parser', function(assert) {
    var options = {
        'filename': 'test/fixtures/planet-notes-latest-truncated.osn',
        'pgURL': TEST_PG_URL
    };
    processNotes(options, function() {
        assert.pass('post notes processing callback called');
        pg.connect(options.pgURL, function(err, client) {
            if (err) {
                console.log('db connection error', err);
            }
            var q = queue(10);
            notesFirstRunQueries.forEach(function(query) {
                q.defer(runQuery, client, assert, query);
            });

            q.awaitAll(function() {
                assert.end();
            });
        });
    });
});

tape('check changesets parser', function(assert) {
    var options = {
        'filename': 'test/fixtures/discussions-latest-truncated.osm',
        'pgURL': TEST_PG_URL
    };
    processChangesets(options, function() {
        assert.pass('post changesets processing callback called');
        pg.connect(options.pgURL, function(err, client) {
            if (err) {
                console.log('db connection error', err);
            }
            var q = queue(10);
            changesetsFirstRunQueries.forEach(function(query) {
                q.defer(runQuery, client, assert, query);
            });
            q.awaitAll(function() {
                assert.end();
                process.exit(0);
            });
        });
    });
});

function runQuery(client, assert, query, callback) {
    var sql = query.sql;
    client.query(sql, [], function(err, result) {
        if (err) {
            console.log('failed executing query', sql, err);
        }
        assert.deepEqual(result.rows, query.expected, query.description);
        callback();
    });
}
