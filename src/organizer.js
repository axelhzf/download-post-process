var fs = require("co-fs");
var path = require("path");
var FuzzySet = require("fuzzyset.js");
var co = require("co");
var filter = require("co-filter");

exports.move = function (file, destPath, cb) {
  co(function* () {
    var directories = yield getDirectories(destPath);

    var basename = path.basename(file);
    var matching = findDestination(basename, directories);
    if (!matching) return;

    var newPath = destPath + "/" + matching + "/" + basename;
    yield fs.rename(file, newPath);
    return newPath;
  })(cb);
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
  if (!matching) return;

  return matching[0][1];
}


function* getDirectories (rootDir) {
  var files = yield fs.readdir(rootDir);
  var directories = yield filter(files, function* (file) {
    if (file[0] === ".") return false;
    var filePath = rootDir + "/" + file;
    var stat = yield fs.stat(filePath);
    return stat.isDirectory();
  });
  return directories;
}

