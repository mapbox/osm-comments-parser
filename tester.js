/* eslint-disable */
'use strict';
var parser = require('./index');
var mdt = require('mapbox-data-team').getEverything();


var filepath = __dirname + '/test/fixtures/' + '670-shiv.osc.gz';
var statepath =  __dirname + '/test/fixtures/' + '480-shiv.state.txt';
parser.parseChanges({
    'filename': filepath,
    'statefile': statepath,
    'users': mdt
}, function (err2) {
    if (err2) {
        process.stdout.write('minutely processing failed', err2);
        return process.exit(1);
    }
    process.stdout.write('done processing minutely changes, deleting tmp file');
    process.exit(0);
    // fs.unlinkSync(filepath);
});
