var helpers = require('../helpers');
var stringify = require('csv').stringify;
var fs = require('fs');
var path = require('path');

module.exports = {};

module.exports.saveChangeset = saveChangeset;
module.exports.writeToCSV = writeToCSV;
module.exports.writeUsers = writeUsers;

var changesets = [];
var comments = [];
var tags = [];
var users = {};

var changesetsFile = path.join('csv', 'changesets.csv');
var commentsFile = path.join('csv', 'comments.csv');
var tagsFile = path.join('csv', 'tags.csv');

function saveChangeset(changeset, next) {
    var attribs = changeset.attributes;
    var row = [
        attribs.ID,
        attribs.CREATED_AT,
        attribs.CLOSED_AT ? attribs.CLOSED_AT : null,
        attribs.OPEN,
        attribs.UID,
        attribs.NUM_CHANGES,
        attribs.MIN_LON,
        attribs.MIN_LAT,
        attribs.MAX_LON,
        attribs.MAX_LAT
    ];
    changesets.push(row);
    addUser(attribs.UID, attribs.USER);
    changeset.comments.forEach(function(comment) {
        comment.changesetID = changeset.attributes.ID;
        var attribs = comment.attributes;
        var commentRow = [
            helpers.getHash(JSON.stringify(comment)),
            comment.changesetID,
            attribs.UID ? attribs.UID : null,
            attribs.DATE,
            comment.text
        ];
        comments.push(commentRow);
    });
    changeset.tags.forEach(function(tag) {
        var attribs = tag.attributes;
        attribs.changesetID = changeset.attributes.ID;
        var tagRow = [
            helpers.getHash(JSON.stringify(attribs)),
            attribs.changesetID,
            attribs.K,
            attribs.V
        ];
        tags.push(tagRow);
    });
    if (changesets.length > 100000) {
        writeToCSV(function() {
            next();
        });
    } else {
        next();
    }
}

function writeToCSV(callback) {
    console.log('writing CSV');
    var data = '';
    var stringifier = stringify();
    stringifier.on('readable', function(){
      while(row = stringifier.read()){
        data += row;
      }
    });
    stringifier.on('error', function(err){
      consol.log(err.message);
    });
    stringifier.on('finish', function(){
        var outStream = fs.createWriteStream(changesetsFile, {'flags': 'a'});
        outStream.write(data, function() {
            writeTags(callback);
        });
    });
    changesets.forEach(function(row) {
        stringifier.write(row);
    });
    stringifier.end();
    changesets = [];
    return;
}

function writeTags(callback) {
    var data = '';
    var stringifier = stringify();
    stringifier.on('readable', function(){
      while(row = stringifier.read()){
        data += row;
      }
    });
    stringifier.on('error', function(err){
      consol.log(err.message);
    });
    stringifier.on('finish', function(){
        var outStream = fs.createWriteStream(tagsFile, {'flags': 'a'});
        outStream.write(data, function() {
            writeComments(callback);
        });
    });
    tags.forEach(function(row) {
        stringifier.write(row);
    });
    stringifier.end();
    tags = [];
    return;    
}

function writeComments(callback) {
    if (comments.length === 0) {
        callback();
        return;
    }
    var data = '';
    var stringifier = stringify();
    stringifier.on('readable', function(){
      while(row = stringifier.read()){
        data += row;
      }
    });
    stringifier.on('error', function(err){
      consol.log(err.message);
    });
    stringifier.on('finish', function(){
        var outStream = fs.createWriteStream(commentsFile, {'flags': 'a'});
        outStream.write(data, callback);
    });
    comments.forEach(function(row) {
        stringifier.write(row);
    });
    stringifier.end();
    comments = [];
    return;
}

function writeUsers(callback) {
    var usersFile = path.join('csv', 'users.csv');
    var usersArray = [];
    for (var key in users) {
        var user = [
            key,
            users[key]
        ];
        usersArray.push(user);
    }
    var data = '';
    var stringifier = stringify();
    stringifier.on('readable', function(){
      while(row = stringifier.read()){
        data += row;
      }
    });
    stringifier.on('error', function(err){
      consol.log(err.message);
    });
    stringifier.on('finish', function(){
        var outStream = fs.createWriteStream(usersFile, {'flags': 'a'});
        outStream.write(data, callback);
    });
    usersArray.forEach(function(row) {
        stringifier.write(row);
    });
    stringifier.end();
    return;    
}

function addUser(id, name) {
    if (!users.hasOwnProperty(id)) {
        users[id] = name;
    }
    return;
}