'use strict';
module.exports = function() {
  return {
    username: null,
    nodes: {
      m: 0,
      d: 0,
      c: 0
    },
    ways: {
      m: 0,
      d: 0,
      c: 0
    },
    relations: {
      m: 0,
      d: 0,
      c: 0
    },
    changesets: [],
    tags_modified: {},
    tags_created: {},
    tags_deleted: {}
  };
};