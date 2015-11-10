'use strict';

module.exports = {
    'saveUser': function(client, userID, userName, callback) {
        if (!userID) {
            callback(null);
            return;
        }
        var checkUserQuery = 'SELECT id from users where id=$1';

        client.query(checkUserQuery, [userID], function(err, result) {
            if (err) {
                console.log('error checking existing user', err);
            }
            if (result.rows.length > 0) {
                callback(userID);
            } else {
                var insertUserQuery = 'INSERT INTO users (id, name) VALUES ($1, $2)';
                client.query(insertUserQuery, [userID, userName], function(err) {
                    if (err) {
                        console.log('failed at inserting user', err);
                    }
                    callback(userID);
                });
            }
        });
    }
};
