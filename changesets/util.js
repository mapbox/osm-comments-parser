module.exports = {};
module.exports.getIsUnreplied = getIsUnreplied;
module.exports.getChangesetTags = getChangesetTags;

function getIsUnreplied(uid, comments) {
    var lastComment = comments.slice(-1)[0];
    if (lastComment.attributes.UID === uid) {
        return false;
    } else {
        return true;
    }
}

function getChangesetTags(tags) {
    var ret = {
        'comment': null,
        'source': null,
        'created_by': null,
        'imagery_used': null
    };
    tags.forEach(function(tag) {
        var key = tag.attributes.K;
        var value = tag.attributes.V;
        if (ret.hasOwnProperty(key)) {
            ret[key] = value;
        }
    });
    return ret;
}
