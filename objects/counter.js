'use strict';
var osmium = require('osmium');
var _ = require('underscore');
var objUser = require('./objUser');
var tags = require('./tags');
var mbxUsers = require('mapbox-data-team').getEverything();
module.exports = function(options, done) {
	var counterObj = {
		users: null,
		osmdate: null
	};

	var users = {};
	for (var i = 0; i < mbxUsers.length; i++) {
		var u = new objUser();
		u.uid = mbxUsers[i].uid;
		u.username = mbxUsers[i].username;
		users[u.uid] = u;
	}
	var reader = new osmium.Reader(options.filename);
	var handler = new osmium.Handler();
	// //WAY	
	handler.on('way', function(way) {
		counterObj.osmdate = way.timestamp_seconds_since_epoch - way.timestamp_seconds_since_epoch % 1000;
		if (users[way.uid]) {
			users[way.uid] = countVersion('way', users[way.uid], way);
			users[way.uid].changeset.push(way.changeset);
			users = countTags(users, way);
		}
	});
	//NODE
	handler.on('node', function(node) {
		counterObj.osmdate = node.timestamp_seconds_since_epoch - node.timestamp_seconds_since_epoch % 1000;

		if (users[node.uid]) {
			users[node.uid] = countVersion('node', users[node.uid], node);
			users[node.uid].changeset.push(node.changeset);
			users = countTags(users, node);
		}
	});
	//RELATION
	handler.on('relation', function(relation) {
		counterObj.osmdate = relation.timestamp_seconds_since_epoch - relation.timestamp_seconds_since_epoch % 1000;
		if (users[relation.uid]) {
			users[relation.uid] = countVersion('relation', users[relation.uid], relation);
			users[relation.uid].changeset.push(relation.changeset);
			users = countTags(users, relation);
		}
	});
	osmium.apply(reader, handler);
	_.each(users, function(val, key) {
		val.changeset = _.size(_.uniq(val.changeset));
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
		if (tags[k] && (tags[k][v] || tags[k].all)) {
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