var fs = require("co-fs");
var path = require("path");
var co = require("co");
var thunkify = require("thunkify");
var mkdirp = thunkify(require("mkdirp"));
var _ = require("underscore");
var _s = require("underscore.string");

function move(file, destPath, cb) {
  co(function* () {
    var basename = path.basename(file);
    var show = showFromPath(basename);
    if (!show) return;

    yield mkdirp(path.join(destPath, show));
    var newPath = path.join(destPath, show, basename);
    yield fs.rename(file, newPath);
    return newPath;
  })(cb);
}

var UNCAPITALIZED_WORDS = ["of", "a", "and"];

function showFromPath (path) {
  path = path.replace(/\s/g, ".");
  var showMatch = path.match(/(?:.*\/)?(.*)\.(S\d\dE\d\d)/i);
  if (!showMatch) return;

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
exports.showFromPath = showFromPath;

