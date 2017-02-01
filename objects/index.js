'use strict';

var fs = require('fs');
var pg = require('pg');
var decompres = require('./decompres');
var counter = require('./counter');

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
    parseObjetcs(options, client, function() {
      done();
      if (callback) callback();
    });
  });
}

function parseObjetcs(options, client, callback) {
  decompres(options, function(err, opts) {
    if (err) return console.log('error decompresing the file ' + err);
    counter(opts, function(users) {
      console.log(users);
    });
  });
}