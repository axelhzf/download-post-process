var fs = require("co-fs");
var path = require("path");
var co = require("co");
var Promise = require("bluebird");
var mkdirp = Promise.promisify(require("mkdirp"));
var _ = require("underscore");
var _s = require("underscore.string");

function move(file, destPath) {
  return co(function* () {
    var basename = path.basename(file);
    var item = guestItem(basename);
    if (!item) return;

    var newFolderPath;
    if (item.type === "tvshow") {
      newFolderPath = path.join(destPath, "tvshows", item.normalizedName);
    } else if (item.type === "movie") {
      newFolderPath = path.join(destPath, "movies");
    }

    if (newFolderPath) {
      yield mkdirp(newFolderPath);
      var newPath = path.join(newFolderPath, basename);
      yield fs.rename(file, newPath);
      return newPath;
    }
  });
}


function guestItem(basename) {
  var item;

  if (isTvshowLike(basename)) {
    item = {
      type: "tvshow",
      normalizedName: tvShowNormalize(basename)
    }
  } else if (isMovieLike(basename)) {
    item = {
      type: "movie"
    }
  }
  return item;
}

function isTvshowLike(basename) {
  var showMatch = tvShowRegexpMatch(basename);
  return !!showMatch;
}

function isMovieLike(basename) {
  return true; //todo find movie patterns
}


function tvShowRegexpMatch(basename) {
  basename = basename.replace(/\s/g, ".");
  return basename.match(/(?:.*\/)?(.*)\.(S\d\dE\d\d)/i);
}

var UNCAPITALIZED_WORDS = ["of", "a", "and"];

function tvShowNormalize(basename) {
  var showMatch = tvShowRegexpMatch(basename);
  var show = showMatch[1].toLowerCase();
  var words = show.split(".");
  show = words.map(function (word) {
    if (!_.contains(UNCAPITALIZED_WORDS, word)) {
      return _s.capitalize(word);
    }
    return word;
  }).join(".");
  return show;
}

exports.move = move;
exports.guestItem = guestItem;

