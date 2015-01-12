var fs = require("fs");
var temp = require("temp");
var Promise = require("bluebird");
var mkTempDir = Promise.promisify(temp.mkdir);
var _s = require("underscore.string");

function createTmpFile (fullPath, size) {
  size = size || 1;
  var data = _s.repeat("testWord", size);
  fs.writeFileSync(fullPath, data);
  return fullPath;
}

function *createTmpDirectory () {
  return yield mkTempDir("");
}

exports.createTmpFile = createTmpFile;
exports.createTmpDirectory = createTmpDirectory;