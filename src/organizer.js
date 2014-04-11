var fs = require("fs");
var path = require("path");
var FuzzySet = require("fuzzyset.js");
var async = require("async");

exports.move = function (file, destPath, cb) {
  getDirectories(destPath, function (directories) {
    var basename = path.basename(file);
    var matching = findDestination(basename, directories);

    if (!matching) {
      return cb();
    }

    var newPath = destPath + "/" + matching + "/" + basename;
    fs.rename(file, newPath, function (err) {
      cb(err, newPath);
    });
  });
};

function findDestination (path, directories) {

  var seasonIndex = path.search(/S\d\dE\d\d/i);
  if (seasonIndex < 0) {
    return;
  }

  path = path.substring(0, seasonIndex);

  var fuzzySet = new FuzzySet();
  directories.forEach(function (directory) {
    fuzzySet.add(directory);
  });
  var matching = fuzzySet.get(path);

  if (!matching)
    return;

  return matching[0][1];
}

function getDirectories (rootDir, cb) {
  fs.readdir(rootDir, function (err, files) {
    if (err) cb(err);

    async.filter(files, function (file, cb) {
      if (file[0] === ".") return cb(null, false);

      var filePath = rootDir + "/" + file;
      fs.stat(filePath, function (err, stat) {
        cb(stat.isDirectory());
      });
    }, cb);

  });

}