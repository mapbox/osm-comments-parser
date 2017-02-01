'use strict';
module.exports = function() {
  return {
    username: null,
    date: 0,
    node: {
      m: 0,
      d: 0,
      c: 0
    },
    way: {
      m: 0,
      d: 0,
      c: 0
    },
    relation: {
      m: 0,
      d: 0,
      c: 0
    },
    changeset: [],
    tags: {}
  };
};