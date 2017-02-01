'use strict';
var osmium = require('osmium');
var _ = require('underscore');
var objUser = require('./objUser');
var tags = require('./tags');
var fs = require('fs');
module.exports = function(options, done) {
	var counterObj = {
		users: null,
		osmdate: null
	};

	var users = {};
	if (options.users) {
		options.users.forEach(function (user) {
			var u = new objUser();
			u.uid = user.uid;
			u.username = user.username;
			users[u.uid] = u;
		});
	}
	var reader = new osmium.Reader(options.filename);
	var timestamp = Date.parse(fs.statSync(options.filename).birthtime) / 1000;
	counterObj.osmdate = timestamp;
	var handler = new osmium.Handler();

	//WAY
	handler.on('way', function(way) {
		if (!users[way.uid]) {
			users[way.uid] = new objUser();
		}
		users[way.uid] = countVersion('way', users[way.uid], way);
		users[way.uid].changesets.push(way.changeset);
		users = countTags(users, way);
	});

	//NODE
	handler.on('node', function(node) {
		if (!users[node.uid]) {
			users[node.uid] = new objUser();
			users[node.uid].username = node.user;
		}
		users[node.uid] = countVersion('node', users[node.uid], node);
		users[node.uid].changesets.push(node.changeset);
		users = countTags(users, node);
	});

	//RELATION
	handler.on('relation', function(relation) {
		if (!users[relation.uid]) {
			users[relation.uid] = new objUser();
		}
		users[relation.uid] = countVersion('relation', users[relation.uid], relation);
		users[relation.uid].changesets.push(relation.changeset);
		users = countTags(users, relation);
	});
	osmium.apply(reader, handler);

	_.each(users, function(val, key) {
		val.changesets = _.size(_.uniq(val.changesets));
		_.each(val.tags, function(v, k) {
			val.tags[k] = sortObject(val.tags[k]);
		});
	});

	counterObj.users = users;
	done(counterObj);
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
	_.each(obj.tags(), function(v, k) {
		if (users[obj.uid].tags[k]) {
			if (users[obj.uid].tags[k][v]) {
				users[obj.uid].tags[k][v] = users[obj.uid].tags[k][v] + 1;
			} else {
				users[obj.uid].tags[k][v] = 1;
			}
		} else {
			users[obj.uid].tags[k] = {};
			users[obj.uid].tags[k][v] = 1;
		}
	});
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