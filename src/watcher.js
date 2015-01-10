var organizer = require("./organizer");
var subtitlesDownloader = require("subtitles-downloader");
var _ = require("underscore");
var fs = require("mz/fs");
var path = require("path");
var co = require("co");
var EventEmitter = require("events").EventEmitter;
var exec = require('mz/child_process').exec;
var winston = require("winston");
var debug = require("debug")("download-post-process");
var minimatch = require("minimatch");
var bash = require("bash");
var Promise = require("bluebird");
var glob = Promise.promisify(require("glob"));

var logger = winston.loggers.add('watcher', {
  console: {
    level: 'silly',
    colorize: 'true',
    timestamp: true
  }
});

var GLOB = "*.+(mkv|avi|mp4)";
var NESTED_GLOB = "**/" + GLOB;

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
    var self = this;
    co(function *() {
      var fullPath = path.join(this.basepath, filename);
      try {
        yield self.processPath(fullPath);
      } catch (e) {
        logger.error(e);
      }
    });
  },

  processBaseDirectory: function () {
    var self = this;
    return co(function *() {
      var directoryContent = yield fs.readdir(self.basepath);
      for (var i = 0; i < directoryContent.length; i++) {
        var content = directoryContent[i];
        var fullPath = path.join(self.basepath, content);
        try {
          yield self.processPath(fullPath);
        } catch (e) {
          logger.error("Error processing path", e);
        }
      }
      logger.info("Base directory updated %s", self.basepath);
      self.events.emit("initialized");
    });
  },

  processPath: function *(fullPath) {
    var stat = yield fs.stat(fullPath);
    if (stat.isDirectory()) {
      yield this.processDirectory(fullPath);
    } else {
      yield this.processFile(fullPath);
    }
  },

  processFile: function *(file) {
    var baseFile = path.basename(file);
    var match = minimatch(baseFile, GLOB);

    if (!match) {
      debug("Doesn't match %s %s/%s", file, this.basepath, GLOB);
      return;
    }

    var sampleMatch = baseFile.match(/sample/i);

    if (sampleMatch) {
      debug("Ignoring sample file %s", file);
      return;
    }

    var movedFile = yield organizer.move(file, this.destpath);
    if (movedFile) {
      yield subtitlesDownloader.downloadSubtitle(movedFile, "eng");
      yield subtitlesDownloader.downloadSubtitle(movedFile, "spa");
    }
    this.events.emit("processFile", file);
  },

  processDirectory: function *(dir) {
    var files = yield glob(NESTED_GLOB, {cwd: dir});
    for(var i = 0; i < files.length; i++) {
      yield this.processFile(path.join(dir, files[i]));
    }
    if (files.length > 0 ) {
      yield exec("rm -rf " + bash.escape(dir));
    }
  }

};

var watcher = function (basepath, destpath) {
  return new Watcher(basepath, destpath);
};

module.exports = watcher;