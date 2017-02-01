'use strict';

var tape = require('tape');
var processNotes = require('../index').parseNotes;
var processChangesets = require('../index').parseChangesets;
var processChanges = require('../index').parseChanges;
var pg = require('pg');
var queue = require('queue-async');
var notesFirstRunQueries = require('./fixtures/notes-first-run-queries.json');
var changesetsFirstRunQueries = require('./fixtures/changesets-first-run-queries.json');
var notesSecondRunQueries = require('./fixtures/notes-second-run-queries.json');
var changesetsSecondRunQueries = require('./fixtures/changesets-second-run-queries.json');
var changesQueries = require('./fixtures/changes-queries.json');

var TEST_PG_URL = process.env.OSM_COMMENTS_TEST_POSTGRES_URL || 'postgres://postgres@localhost/osm-comments-test';

tape('check changes parse', function(assert) {
    var options = {
        'filename': 'test/fixtures/minutely-replication.osc.gz',
        'pgURL': TEST_PG_URL
    };
    processChanges(options, function() {
        assert.pass('post changes processing callback called');
        pg.connect(options.pgURL, function(err, client) {
            if (err) {
                console.log('db connection error', err);
            }
            var q = queue(10);
            changesQueries.forEach(function(query) {
                q.defer(runQuery, client, assert, query);
            });

            q.awaitAll(function() {
                assert.end();
            });
        });
    });
});

tape('check notes parser', function(assert) {
    var options = {
        'filename': 'test/fixtures/notes-first-run.osn',
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
        'filename': 'test/fixtures/discussions-first-run.osm',
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
                // process.exit(0);
            });
        });
    });
});

tape('check notes parser on update', function(assert) {
    var options = {
        'filename': 'test/fixtures/notes-second-run.osn',
        'pgURL': TEST_PG_URL
    };
    processNotes(options, function() {
        assert.pass('notes parser update ran and callback called');
        pg.connect(options.pgURL, function(err, client) {
            if (err) {
                console.log('db connection error', err);
            }
            var q = queue(10);
            notesSecondRunQueries.forEach(function(query) {
                q.defer(runQuery, client, assert, query);
            });
            q.awaitAll(function() {
                assert.end();
            });
        });
    });
});

tape('check changeset parser on update', function(assert) {
    var options = {
        'filename': 'test/fixtures/discussions-second-run.osm',
        'pgURL': TEST_PG_URL
    };
    processChangesets(options, function() {
        assert.pass('changeset parser update ran and callback called');
        pg.connect(options.pgURL, function(err, client) {
            if (err) {
                console.log('db connection error', err);
            }
            var q = queue(10);
            changesetsSecondRunQueries.forEach(function(query) {
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
