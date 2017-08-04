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
            q.defer(saveChange, client, timestamp, parseInt(key, 10), changes.users[key], changes.replicationId);
        }
    });
    q.awaitAll(function() {
        next();
    });
}
function saveChange(client, timestamp, uid, user, replicationId, callback) {
    dbUsers.saveUser(client, uid, user.username, function(err) {
        if (err) {
            console.log('error inserting user object', err);
            return callback(err);
        }

        var md5 = helpers.getHash(replicationId.toString() + uid.toString());
        var checkQuery = 'SELECT id from stats WHERE id=$1';

        client.query(checkQuery, [md5], function(err, result) {
            if (err) {
                console.log('error checking existing stats row', err);
            }

            var params = [
                md5,
                timestamp,
                uid,
                user.nodes,
                user.ways,
                user.relations,
                user.changesets,
                user.tags_created,
                user.tags_modified,
                user.tags_deleted,
                user.nodes_created,
                user.ways_created,
                user.relations_created,
                user.nodes_modified,
                user.ways_modified,
                user.relations_modified,
                user.nodes_deleted,
                user.ways_deleted,
                user.relations_deleted
            ];

            if (result.rows.length === 0) {
                var insertQuery = 'INSERT INTO stats (id, change_at, uid, nodes, ways, relations, changesets, tags_created, tags_modified, tags_deleted, nodes_created, ways_created, relations_created, nodes_modified, ways_modified, relations_modified, nodes_deleted, ways_deleted, relations_deleted) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)';
                client.query(insertQuery, params, function(err) {
                    if (err) {
                        console.log('error inserting change object', err);
                        return callback(err);
                    }
                    callback();
                });
            } else {
                var updateQuery = 'UPDATE stats SET change_at=$2, uid=$3, nodes=$4, ways=$5, relations=$6, changesets=$7, tags_created=$8, tags_modified=$9, tags_deleted=$10, nodes_created=$11, ways_created=$12, relations_created=$13, nodes_modified=$14, ways_modified=$15, relations_modified=$16, nodes_deleted=$17, ways_deleted=$18, relations_deleted=$19 WHERE id=$1';
                client.query(updateQuery, params, function(err) {
                    if (err) {
                        console.log('error updating stats row', err);
                        return callback(err);
                    }
                    callback();
                });
            }
        });
    });
}
