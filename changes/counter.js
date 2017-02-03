'use strict';
var osmium = require('osmium');
var _ = require('underscore');
var userModel = require('./user-model');
var fs = require('fs');
module.exports = function(options, done) {
	var counterObj = {
		users: null,
		timestamp: null
	};

	var users = {};
	if (options.users) {
		options.users.forEach(function (user) {
			var u = new userModel();
			u.uid = user.uid;
			u.username = user.username;
			users[u.uid] = u;
		});
	}
	var reader = new osmium.Reader(options.filename);
	var timestamp = fs.statSync(options.filename).birthtime;
	counterObj.timestamp = timestamp;
	var handler = new osmium.Handler();

	//WAY
	handler.on('way', function(way) {
		if (!users[way.uid]) {
			users[way.uid] = new userModel();
		}
		users[way.uid] = countVersion('ways', users[way.uid], way);
		users[way.uid].changesets.push(way.changeset);
		users = countTags(users, way);
	});

	//NODE
	handler.on('node', function(node) {
		if (!users[node.uid]) {
			users[node.uid] = new userModel();
			users[node.uid].username = node.user;
		}
		users[node.uid] = countVersion('nodes', users[node.uid], node);
		users[node.uid].changesets.push(node.changeset);
		users = countTags(users, node);
	});

	//RELATION
	handler.on('relation', function(relation) {
		if (!users[relation.uid]) {
			users[relation.uid] = new userModel();
		}
		users[relation.uid] = countVersion('relations', users[relation.uid], relation);
		users[relation.uid].changesets.push(relation.changeset);
		users = countTags(users, relation);
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
		users[obj.uid].tags_deleted = tagsCount;
	} else if (obj.version > 1) {
		users[obj.uid].tags_modified = tagsCount;
	} else {
		users[obj.uid].tags_created = tagsCount;
	}
	return users;
}

function sortObject(obj) {
	var arr = [];
	var prop;
	for (prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			arr.push({
				key: prop,
				value: obj[prop]
			});
		}
	}
	arr.sort(function(a, b) {
		return a.value - b.value;
	}).reverse();
	var sortTags = {};
	for (var i = 0; i < arr.length; i++) {
		sortTags[arr[i].key] = arr[i].value;
	}
	return sortTags;
}