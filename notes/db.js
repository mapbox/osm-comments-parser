'use strict';

/*
    Responsible for interfacing with the database
*/
var util = require('util');
var helpers = require('../helpers');
var queue = require('queue-async');
var dbUsers = require('../users/db');
var _ = require('underscore');

module.exports = {};

module.exports.saveNote = saveNote;

function saveNote(client, note, next) {
    console.log('saveNote...');
    var attribs = note.attributes;
    var id = attribs.ID;
    var lat = parseFloat(attribs.LAT);
    var lon = parseFloat(attribs.LON);
    var user = getOpenedByUser(note);
    var userID = user.id ? Number(user.id) : null;
    var userName =  user.name || null;
    var createdAt = attribs.CREATED_AT;
    var closedAt = attribs.CLOSED_AT || null;
    var pt = util.format('POINT(%d %d)', lon, lat);
    var params = [id, createdAt, closedAt, userID, pt];
    var selectQuery = 'SELECT id, created_at from notes where id=$1';

    client.query(selectQuery, [id], function(err, result) {
        if (err) {
            console.log('error selecting note', err);
        }
        if (result.rows.length > 0) {
            console.log('note exists...');
            var dbCreatedAt = result.rows[0].created_at;
            var dbClosedAt = result.rows[0].closed_at;
            var xmlCreatedAt = new Date(createdAt);
            var xmlClosedAt = closedAt ? new Date(closedAt) : null;
            var dbClosedAtISOString = dbClosedAt ? dbClosedAt.toISOString() : null;
            var xmlClosedAtISOString = xmlClosedAt ? xmlClosedAt.toISOString() : null;
            if (dbCreatedAt.toISOString() !== xmlCreatedAt.toISOString() || dbClosedAtISOString !== xmlClosedAtISOString) {
                console.log('updateNote...');
                updateNote(client, params, note, next, saveComments);
            } else {
                console.log('save comments...');
                saveComments(client, note, next);
            }
        } else {
            dbUsers.saveUser(client, userID, userName, function() {
                insertNote(client, params, note, next, saveComments);
            });
        }
    });
}

function getOpenedByUser(note) {
    var openingComment = _.find(note.comments, function(comment) {
        return comment.attributes.ACTION === 'opened';
    });
    if (!openingComment) {
        return {};
    }
    return {
        'id': openingComment.attributes.UID || null,
        'name': openingComment.attributes.USER || null
    };
}

function updateNote(client, params, note, next, callback) {
    var updateQuery = 'UPDATE notes SET created_at=$2, closed_at=$3, opened_by=$4, point=ST_GeomFromText($5, 4326) where id=$1';
    client.query(updateQuery, params, function(err) {
        if (err) {
            console.log('error updating note', err);
        }
        callback(client, note, next);
    });
}

function insertNote(client, params, note, next, callback) {
    var insertQuery = 'INSERT INTO notes (id, created_at, closed_at, opened_by, point) VALUES ($1, $2, $3, $4, ST_GeomFromText($5, 4326))';
    client.query(insertQuery, params, function(err) {
        if (err) {
            console.log('error inserting note', err);
        }
        callback(client, note, next);
    });
}

function saveComments(client, note, next) {
    var comments = note.comments;
    if (comments.length === 0) {
        return next();
    }

    var q = queue(1);
    comments.forEach(function(comment) {
        console.log('comments # ', comments.length);
        q.defer(saveComment, client, comment, note);
    });
    q.awaitAll(function() {
        console.log('done saving note and comments.');
        next();
    });
}

function saveComment(client, comment, note, callback) {
    var noteID = note.attributes.ID;
    var attribs = comment.attributes;
    var action = attribs.ACTION;
    var timestamp = attribs.TIMESTAMP;
    var commentText = comment.text || '';
    var userID = attribs.UID || null;
    var userName = attribs.USER || null;
    var md5 = helpers.getHash(JSON.stringify(attribs));
    var checkQuery = 'SELECT id from note_comments WHERE id=$1';
    client.query(checkQuery, [md5], function(err, result) {
        if (err) {
            console.log('error checking existing comment', err);
        }
        if (result.rows.length === 0) {
            dbUsers.saveUser(client, userID, userName, function() {
                var insertCommentQuery = 'INSERT INTO note_comments (id, note_id, action, comment, timestamp, user_id) VALUES ($1, $2, $3, $4, $5, $6)';
                client.query(insertCommentQuery, [md5, noteID, action, commentText, timestamp, userID], function(err) {
                    if (err) {
                        console.log('error inserting comment', err);
                    }
                    callback();
                });
            });
        } else {
            callback();
        }
    });
}
