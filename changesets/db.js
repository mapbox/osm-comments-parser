'use strict';

var dbUsers = require('../users/db');
var helpers = require('../helpers');
var queue = require('queue-async');
var util = require('./util');

module.exports = {};

module.exports.saveChangeset = saveChangeset;

function saveChangeset(client, changeset, next) {
    var attribs = changeset.attributes;

    // if changeset is still open, don't save it
    if (attribs.OPEN === 'true' || attribs.COMMENTS_COUNT === '0') {
        return next();
    }

    var id = attribs.ID;
    var selectQuery = 'SELECT id, discussion_count FROM changesets WHERE id=$1';
    client.query(selectQuery, [id], function(err, result) {
        if (err) {
            console.log('error selecting changeset', err);
        }
        if (result.rows.length > 0) {
            if (result.rows[0].discussion_count === Number(attribs.COMMENTS_COUNT)) {
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
            var isUnreplied = util.getIsUnreplied(userID, changeset.comments) ? 'true' : 'false';
            var tags = util.getChangesetTags(changeset.tags);
            var insertQuery = 'INSERT INTO changesets (id, created_at, closed_at, is_open, user_id, username, comment, source, created_by, imagery_used, bbox, num_changes, discussion_count, is_unreplied) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, ST_MakeEnvelope($11, $12, $13, $14, 4326), $15, $16, $17)';
            var params = [id, createdAt, closedAt, isOpen, userID, userName, tags.comment, tags.source, tags.created_by, tags.imagery_used, attribs.MIN_LON, attribs.MIN_LAT, attribs.MAX_LON, attribs.MAX_LAT, numChanges, discussionCount, isUnreplied];
            dbUsers.saveUser(client, userID, userName, function() {
                client.query(insertQuery, params, function(err) {
                    if (err) {
                        console.log('error inserting changeset', err);
                        return;
                    }
                    var q = queue(2);
                    q.defer(saveComments, client, changeset);
                    q.awaitAll(function() {
                        next();
                    });
                });
            });
        }
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
    var username = comment.attributes.USER || null;
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
            dbUsers.saveUser(client, userID, username, function() {
                var insertQuery = 'INSERT INTO changeset_comments (id, changeset_id, user_id, username, timestamp, comment) VALUES ($1, $2, $3, $4, $5, $6)';
                client.query(insertQuery, [md5, changesetID, userID, username, timestamp, comment.text], function(err) {
                    if (err) {
                        console.log('error inserting comment', err);
                    }
                    callback();
                });
            });
        }
    });
}
