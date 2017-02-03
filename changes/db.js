'use strict';

var dbUsers = require('../users/db');
var helpers = require('../helpers');
var queue = require('queue-async');

module.exports = {};

module.exports.saveChanges = saveChanges;

function saveChanges(client, changes, next) {
    var q = queue(2);
    var timestamp = changes.timestamp;
    Object.keys(changes.users).forEach(function (key) {
        if (changes.users[key].changesets.length > 0) {
            q.defer(saveChange, client, timestamp, parseInt(key, 10), changes.users[key]);
        }
    });
    q.awaitAll(function() {
        next();
    });
}

function saveChange(client, timestamp, uid, user, callback) {
    var insertQuery = 'INSERT INTO stats (change_at, uid, nodes, ways, relations, changesets, tags_created, tags_modified, tags_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
    var params = [timestamp, uid, user.nodes, user.ways, user.relations, user.changesets, user.tags_created, user.tags_modified, user.tags_deleted];
    dbUsers.saveUser(client, uid, user.username, function (err) {
        if (err) {
            console.log('error inserting user object', err);
            return callback(err);
        }
        client.query(insertQuery, params, function(err) {
            if (err) {
                console.log('error inserting change object', err);
                return callback(err);
            }
            callback();
        });
    } );

}