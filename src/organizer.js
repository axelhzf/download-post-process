var fs = require("co-fs");
var path = require("path");
var co = require("co");
var thunkify = require("thunkify");
var mkdirp = thunkify(require("mkdirp"));

exports.move = function (file, destPath, cb) {
  co(function* () {
    var basename = path.basename(file);
    var matching = findDestination(basename);
    if (!matching) return;

    yield mkdirp(path.join(destPath, matching));
    var newPath = path.join(destPath, matching, basename);
    yield fs.rename(file, newPath);
    return newPath;
  })(cb);
};

function findDestination (path) {
  var episodeMatch = path.match(/(.*)\.(S\d\dE\d\d)/i);
  if (!episodeMatch) {
    return;
  }
  return episodeMatch[1];
}

