'use strict';

module.exports = {
    'saveUser': function(client, userID, userName, attribs, callback) {
        var hasAttribs = true;
        if (typeof(attribs) === 'function') {
            callback = attribs;
            hasAttribs = false;
        }
        if (!userID) {
            callback(null);
            return;
        }
        var checkUserQuery = 'SELECT id, name, changeset_count, num_changes from users where id=$1';

        client.query(checkUserQuery, [userID], function(err, result) {
            if (err) {
                console.log('error checking existing user', err);
                return callback(err);
            }
            if (result.rows.length > 0) {
                if (!hasAttribs) return callback();
                var userRow = result.rows[0];
                var changesetCount = userRow.changeset_count + 1;
                var numChanges = userRow.num_changes + Number(attribs.NUM_CHANGES);
                var firstEditDate = new Date(userRow.first_edit) ? userRow.first_edit : null;
                var changesetDate = new Date(attribs.CREATED_AT);
                if (!firstEditDate || changesetDate < firstEditDate) {
                    firstEditDate = changesetDate;
                }
                var updateQ = 'UPDATE users SET name=$1, changeset_count=$2, num_changes=$3, first_edit=$4 WHERE id=$5';
                var updateParams = [userName, changesetCount, numChanges, firstEditDate, userID];
                client.query(updateQ, updateParams, function(err, result) {
                    if (err) {
                        console.log('failed at updating user', err);
                        return callback(err);
                    }
                    callback(userID);
                });
            } else {

                var insertUserQuery = 'INSERT INTO users (id, name, first_edit, changeset_count, num_changes) VALUES ($1, $2, $3, $4, $5)';
                var insertParams = [
                    userID,
                    userName,
                    hasAttribs ? attribs.CREATED_AT : null,
                    hasAttribs ? 1 : 0, // this is their first changeset
                    hasAttribs ? Number(attribs.NUM_CHANGES) : 0
                ];
                client.query(insertUserQuery, insertParams, function(err) {
                    if (err) {
                        console.log('failed at inserting user', err);
                        return callback(err);
                    }
                    callback(userID);
                });
            }
        });
    }
};
