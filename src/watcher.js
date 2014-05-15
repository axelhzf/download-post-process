var organizer = require("./organizer");
var subtitlesDownloader = require("subtitles-downloader");
var _ = require("underscore");
var fs = require("fs");
var cfs = require("co-fs");
var minimatch = require("minimatch");
var path = require("path");
var glob = require("glob");
var thunkify = require("thunkify");
var co = require("co");
var each = require("co-each");

var winston = require("winston");
var logger = winston.loggers.add('watcher', {
  console: {
    level: 'silly',
    colorize: 'true',
    timestamp: true
  }
});

var GLOB = "*.+(mkv|avi|mp4)";
var SUBTITLES_RETRY_TIME = 1000 * 60 * 10;

function Watcher (basepath, destpath) {
  this.basepath = basepath;
  this.destpath = destpath;

  this.initWatcher();
  this.processBaseDirectory();
}

var glob = thunkify(glob);
var move = thunkify(organizer.move);
var downloadSubtitle = thunkify(subtitlesDownloader.downloadSubtitle);

Watcher.prototype = {

  initWatcher: function () {
    var self = this;
    var watchedEvents = _.object(["change", "rename"], []);
    logger.info("Watching %s/%s -> %s", this.basepath, GLOB, this.destpath);

    this.watcher = fs.watch(this.basepath, function (event, filename) {
      if (_.has(watchedEvents, event)) {
        self.onFsEvent(event, filename);
      }
    });

  },

  stop : function () {
    this.watcher.close();
  },

  onFsEvent: function (event, filename) {
    co(function *() {
      var file = path.join(this.basepath, filename);
      try {
        var stat = yield cfs.stat(file);
        if (stat.isDirectory()) {
          var biggerFile = yield this.findBiggerFileInDirectory(file);
          yield this.processFile(biggerFile);
        } else {
          var match = minimatch(filename, GLOB);
          if (match) {
            yield this.processFile(file);
          }
        }
      } catch (e) {
        logger.error(e);
      }
    }).call(this);
  },

  findBiggerFileInDirectory: function *(directory) {
    var files = yield glob(GLOB, {cwd: directory});
    files = yield _.map(files, function (filename) {
      var file = path.join(directory, filename);
      return {file: file, size: cfs.stat};
    });
    var biggerFile = _.max(files, function (file) {
      return file.stat.size;
    });
    return biggerFile.file;
  },

  processFile: function *(file) {
    var movedFile = yield move(file, this.destpath);
    if (movedFile) {
      yield downloadSubtitle(movedFile, "eng");
      yield downloadSubtitle(movedFile, "spa");
    }
  },

  processBaseDirectory: function () {
    var self = this;
    co(function *() {
      try {
        var files = yield glob(GLOB, {cwd: self.basepath});
        for (var i = 0; i < files.length; i++) {
          yield self.processFile(path.join(self.basepath, files[i]))
        }
        logger.info("Base directory updated %s", self.basepath);
      } catch (e) {
        console.log("Error processing base directory", e);
      }
    })();

  }

};

var watcher = function (basepath, destpath) {
  return new Watcher(basepath, destpath);
};

module.exports = watcher;