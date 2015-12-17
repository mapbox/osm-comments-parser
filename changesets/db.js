'use strict';

var dbUsers = require('../users/db');
var helpers = require('../helpers');
var queue = require('queue-async');

module.exports = {};

module.exports.saveChangeset = saveChangeset;

function saveChangeset(client, changeset, next) {
    var attribs = changeset.attributes;

    // if changeset is still open, don't save it
    if (attribs.OPEN === 'true') {
        return next();

    }

    var id = attribs.ID;
    var selectQuery = 'SELECT id, discussion_count FROM changesets WHERE id=$1';
    client.query(selectQuery, [id], function(err, result) {
        if (err) {
            console.log('error selecting changeset', err);
        }
        if (result.rows.length > 0) {
            //TODO: update discussion count
            if (result.rows[0].discussion_count !== Number(attribs.COMMENTS_COUNT)) {
                return next();
            } else {
                var updateQ = 'UPDATE changesets SET discussion_count=$1 WHERE id=$2';
                var params = [attribs.COMMENTS_COUNT, id];
                client.query(updateQ, params, function(err, result) {
                    saveComments(client, changeset, function() {
                        return next();
                    });
                });
            }
        } else {
            var createdAt = attribs.CREATED_AT;
            var closedAt = attribs.CLOSED_AT || null;
            var isOpen = attribs.OPEN === 'true';
            var userID = attribs.UID;
            var userName = attribs.USER;
            var numChanges = attribs.NUM_CHANGES;
            var discussionCount = attribs.COMMENTS_COUNT;
            var insertQuery = 'INSERT INTO changesets (id, created_at, closed_at, is_open, user_id, bbox, num_changes, discussion_count) VALUES ($1, $2, $3, $4, $5, ST_MakeEnvelope($6, $7, $8, $9, 4326), $10, $11)';
            var params = [id, createdAt, closedAt, isOpen, userID, attribs.MIN_LON, attribs.MIN_LAT, attribs.MAX_LON, attribs.MAX_LAT, numChanges, discussionCount];
            dbUsers.saveUser(client, userID, userName, function() {
                client.query(insertQuery, params, function(err) {
                    if (err) {
                        console.log('error inserting changeset', err);
                        return;
                    }
                    var q = queue(2);
                    q.defer(saveTags, client, changeset);
                    q.defer(saveComments, client, changeset);
                    q.awaitAll(function() {
                        next();
                    });
                });
            });
        }
    });
}

function saveTags(client, changeset, callback) {
    if (changeset.tags.length === 0) {
        callback();
        return;
    }
    var q = queue(3);
    var tags = changeset.tags;
    tags.forEach(function(tag) {
        q.defer(saveTag, client, changeset, tag);
    });
    q.awaitAll(function() {
        callback();
    });
}

function saveTag(client, changeset, tag, callback) {
    var changesetID = changeset.attributes.ID;
    var attribs = tag.attributes;
    var tagKey = attribs.K;
    var tagValue = attribs.V;
    attribs.changesetID = changesetID;
    var md5 = helpers.getHash(JSON.stringify(attribs));
    var insertQuery = 'INSERT INTO changeset_tags (id, changeset_id, key, value) VALUES ($1, $2, $3, $4)';
    client.query(insertQuery, [md5, changesetID, tagKey, tagValue], function(err) {
        if (err) {
            console.log('error inserting tag', err);
        }
        callback();
    });
}

function saveComments(client, changeset, callback) {
    if (changeset.comments.length === 0) {
        callback();
        return;
    }
    var q = queue(3);
    var comments = changeset.comments;
    comments.forEach(function(comment) {
        q.defer(saveComment, client, changeset, comment);
    });
    q.awaitAll(function() {
        callback();
    });
}

function saveComment(client, changeset, comment, callback) {
    // console.log('saving comment', comment);
    var changesetID = changeset.attributes.ID;
    var userID = comment.attributes.UID || null;
    var userName = comment.attributes.USER || null;
    var timestamp = comment.attributes.DATE;
    comment.changesetID = changesetID;
    var md5 = helpers.getHash(JSON.stringify(comment));
    var selectQuery = 'SELECT id from changeset_comments where id=$1';
    client.query(selectQuery, [md5], function(err, result) {
        if (err) {
            console.log('error selecting comment', err);
        }
        if (result.rows.length > 0) {
            callback();
        } else {
            dbUsers.saveUser(client, userID, userName, function() {
                var insertQuery = 'INSERT INTO changeset_comments (id, changeset_id, user_id, timestamp, comment) VALUES ($1, $2, $3, $4, $5)';
                client.query(insertQuery, [md5, changesetID, userID, timestamp, comment.text], function(err) {
                    if (err) {
                        console.log('error inserting comment', err);
                    }
                    callback();
                });
            });
        }
    });
}
