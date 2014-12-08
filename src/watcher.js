var organizer = require("./organizer");
var subtitlesDownloader = require("subtitles-downloader");
var _ = require("underscore");
var fs = require("fs");
var cfs = require("co-fs");
var path = require("path");
var glob = require("glob");
var thunkify = require("thunkify");
var co = require("co");
var each = require("co-each");
var EventEmitter = require("events").EventEmitter;
var exec = require("co-exec");
var winston = require("winston");
var debug = require("debug")("download-post-process");
var minimatch = require("minimatch");
var bash = require("bash");
var path = require("path");

var glob = thunkify(glob);
var move = thunkify(organizer.move);
var downloadSubtitle = thunkify(subtitlesDownloader.downloadSubtitle);

var logger = winston.loggers.add('watcher', {
  console: {
    level: 'silly',
    colorize: 'true',
    timestamp: true
  }
});

var GLOB = "*.+(mkv|avi|mp4)";

function Watcher(basepath, destpath) {
  this.basepath = basepath;
  this.destpath = destpath;
  this.events = new EventEmitter();

  this.events.on("initialized", this.startWatcher.bind(this));
}

Watcher.prototype = {

  start: function () {
    this.processBaseDirectory();
  },

  startWatcher: function () {
    var self = this;
    var watchedEvents = _.object(["change", "rename"], []);
    this.watcher = fs.watch(this.basepath, function (event, filename) {
      if (_.has(watchedEvents, event)) {
        self.onFsEvent(event, filename);
      }
    });
    logger.info("Watching %s/%s -> %s", this.basepath, GLOB, this.destpath);
  },

  stop: function () {
    if (this.watcher) {
      this.watcher.close();
    }
  },

  onFsEvent: function (event, filename) {
    debug("fs event [" + event + "]");
    co(function *() {
      var fullPath = path.join(this.basepath, filename);
      try {
        yield this.processPath(fullPath);
      } catch (e) {
        logger.error(e);
      }
    }).call(this);
  },

  processBaseDirectory: function () {
    var self = this;
    co(function *() {
      var directoryContent = yield cfs.readdir(self.basepath);
      for (var i = 0; i < directoryContent.length; i++) {
        var content = directoryContent[i];
        var fullPath = path.join(self.basepath, content);
        try {
          yield self.processPath(fullPath);
        } catch (e) {
          console.log("Error processing base directory", e);
        }
      }
      logger.info("Base directory updated %s", self.basepath);
      self.events.emit("initialized");

    })();
  },

  processPath: function *(fullPath) {
    //var showMatch = fullPath.match(/(S\d\dE\d\d)/i);
    //if (!showMatch) return;


    var stat = yield cfs.stat(fullPath);
    if (stat.isDirectory()) {
      yield this.processDirectory(fullPath);
    } else {
      yield this.processFile(fullPath);
    }
  },

  processFile: function *(file) {
    var match = minimatch(path.basename(file), GLOB);
    if (match) {
      var movedFile = yield move(file, this.destpath);
      if (movedFile) {
        yield downloadSubtitle(movedFile, "eng");
        yield downloadSubtitle(movedFile, "spa");
      }
      this.events.emit("processFile", file);
    } else {
      debug("Doesn't match %s %s/%s", file, this.basepath, GLOB);
    }
  },

  processDirectory: function *(dir) {
    var biggerFile = yield this.findBiggerFileInDirectory(dir);
    if (biggerFile) {
      yield this.processFile(biggerFile);
    }
    yield exec("rm -rf " + bash.escape(dir));
  },

  findBiggerFileInDirectory: function *(directory) {
    var files = yield glob(GLOB, {cwd: directory});
    var biggerFile;
    var biggerFileSize = -1;
    for (var i = 0; i < files.length; i++) {
      var file = path.join(directory, files[i]);
      var size = (yield cfs.stat(file)).size;
      if (size > biggerFileSize) {
        biggerFile = file;
        biggerFileSize = size;
      }
    }
    return biggerFile;
  }

};

var watcher = function (basepath, destpath) {
  return new Watcher(basepath, destpath);
};

module.exports = watcher;