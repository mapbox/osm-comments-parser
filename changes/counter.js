'use strict';
var osmium = require('osmium');
var _ = require('underscore');
var userModel = require('./user-model');
var fs = require('fs');

function readTimeStamp(options) {
	if (!options.statefile) {
		return fs.statSync(options.filename).ctime;
	}
	var body = fs.readFileSync(options.statefile, {'encoding': 'utf-8'});
	var timestamp = body.split('\n')[3];
	timestamp = timestamp.split('=')[1];
	timestamp = timestamp.split('\\').join('');
	return timestamp;
}

module.exports = function(options, done) {
    var counterObj = {
        users: null,
        timestamp: null
    };
    var users = {};
    if (options.users) {
        options.users.forEach(function (user) {
            var u = new userModel();
            u.uid = parseInt(user.uid, 10);
            u.username = user.username;
            users[u.uid] = u;
        });
    }
    var reader = new osmium.Reader(options.filename);
    var timestamp = readTimeStamp(options);
    counterObj.timestamp = timestamp;
    counterObj.replicationId = options.replicationId;
    var handler = new osmium.Handler();

    //WAY
    handler.on('way', function(way) {
        if (!options.users) {
            if (!users[way.uid]) {
                users[way.uid] = new userModel();
                users[way.uid].username = way.user;
            }
        }
        if (users[way.uid]) {
            users[way.uid] = countVersion('ways', users[way.uid], way);
            users[way.uid].changesets.push(way.changeset);
            users = countTags(users, way);
        }
    });

    //NODE
    handler.on('node', function(node) {
        if (!options.users) {
            if (!users[node.uid]) {
                users[node.uid] = new userModel();
                users[node.uid].username = node.user;
            }
        }
        if (users[node.uid]) {
            users[node.uid] = countVersion('nodes', users[node.uid], node);
            users[node.uid].changesets.push(node.changeset);
            users = countTags(users, node);
        }
    });

    //RELATION
    handler.on('relation', function(relation) {
        if (!options.users) {
            if (!users[relation.uid]) {
                users[relation.uid] = new userModel();
                users[relation.uid].username = relation.user;
            }
        }
        if (users[relation.uid]) {
            users[relation.uid] = countVersion('relations', users[relation.uid], relation);
            users[relation.uid].changesets.push(relation.changeset);
            users = countTags(users, relation);
        }
    });
    osmium.apply(reader, handler);

    _.each(users, function(val, key) {
        val.changesets = _.uniq(val.changesets);
    });

    counterObj.users = users;
    done(null, counterObj);
};

function countVersion(type, user, obj) {
    if (!obj.visible) {
        ++user[type].d;
    } else if (obj.version > 1) {
        ++user[type].m;
    } else {
        ++user[type].c;
    }
    return user;
}

function countTags(users, obj) {
    var tagsCount = {};
    _.each(obj.tags(), function(v, k) {
        if (tagsCount[k]) {
            if (tagsCount[k][v]) {
                tagsCount[k][v] = tagsCount[k][v] + 1;
            } else {
                tagsCount[k][v] = 1;
            }
        } else {
            tagsCount[k] = {};
            tagsCount[k][v] = 1;
        }
    });
    if (!obj.visible) {
        if (!(users[obj.uid]).hasOwnProperty('tags_deleted')) {
            users[obj.uid].tags_deleted = tagsCount;
        } else {
            mergeCounts(users[obj.uid].tags_deleted, tagsCount);
        }
    } else if (obj.version > 1) {
        if (!(users[obj.uid]).hasOwnProperty('tags_modified')) {
            users[obj.uid].tags_modified = tagsCount;
        } else {
            mergeCounts(users[obj.uid].tags_modified, tagsCount);
        }
    } else {
        if (!(users[obj.uid]).hasOwnProperty('tags_created')) {
            users[obj.uid].tags_created = tagsCount;
        } else {
            mergeCounts(users[obj.uid].tags_created, tagsCount);
        }
    }
    return users;
}

function mergeCounts(oldTags, newTags) {
    Object.keys(newTags).forEach(function (k) {
        if (!oldTags.hasOwnProperty(k)) {
            oldTags[k] = {}
        }

        Object.keys(newTags[k]).forEach(function (v) {
            if (!oldTags[k].hasOwnProperty(v)) {
                oldTags[k][v] = newTags[k][v]
            } else {
                oldTags[k][v] = oldTags[k][v] + newTags[k][v]
            }
        });
    });
}
