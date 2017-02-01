'use strict';
var os = require('os');
var request = require('request');
var path = require('path');
var fs = require('fs');
var zlib = require('zlib');

module.exports = function(options, done) {
	var folder = os.tmpDir();
	var outputFile = options.filename.replace('.gz', '');
	var reader = fs.createReadStream(options.filename);
	var localStream = fs.createWriteStream(outputFile);
	reader.pipe(zlib.createGunzip()).pipe(localStream);
	localStream
		.on('error', function(err) {
			done(err, null);
		}).on('close', function(err) {
			options.filename = outputFile;
			done(err, options);
		});
};