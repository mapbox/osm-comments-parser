'use strict';

var crypto = require('crypto');
var util = require('util');

module.exports = {
    getHash: function(string) {
        return crypto.createHash('md5').update(string).digest('hex');
    },

    getBBOX: function(minLon, minLat, maxLon, maxLat) {
        return util.format('((%s, %s), (%s, %s))', minLon, minLat, maxLon, maxLat);
    }
};
