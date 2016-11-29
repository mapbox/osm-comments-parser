module.exports = {};
module.exports.getIsUnreplied = getIsUnreplied;

function getIsUnreplied(uid, comments) {
    var lastComment = comments.slice(-1)[0];
    if (lastComment.attributes.UID === uid) {
        return false;
    } else {
        return true;
    }
}
