var organizer = require("./organizer");
var subtitlesDownloader = require("subtitles-downloader");
var _ = require("underscore");
var fs = require("fs");
var minimatch = require("minimatch");
var path = require("path");
var glob = require("glob");
var async = require("async");

var GLOB = "*.+(mkv|avi|mp4)";

function Watcher (basepath, destpath) {
  this.basepath = basepath;
  this.destpath = destpath;

  this.initWatcher();
}

Watcher.prototype = {

  initWatcher: function () {
    var self = this;
    var watchedEvents = _.object(["change", "rename"], []);
    console.log("Watching " + this.basepath + "/" + GLOB + " -> " + this.destpath);
    fs.watch(this.basepath, function (event, filename) {
      if (_.has(watchedEvents, event)) {
        self.onFsEvent(event, filename);
      }
    });
  },

  onFsEvent: function (event, filename) {
    var self = this;
    var file = path.join(this.basepath, filename);
    fs.stat(file, function (err, stat) {
      if (err) return;
      if (stat.isDirectory()) {
        //avoid previews
        self.findBiggerFileInDirectory(file, function (err, biggerFile) {
          self.processFile(biggerFile);
        });
      } else {
        var match = minimatch(filename, GLOB);
        if (match) {
          self.processFile(file);
        }
      }
    });
  },

  findBiggerFileInDirectory: function (directory, cb) {
    glob(GLOB, {cwd: directory}, function (err, files) {
      async.mapSeries(files, function (filename, cb) {
        var file = path.join(directory, filename);
        fs.stat(file, function (err, stat) {
          cb(err, {file: file, stat: stat});
        });
      }, function (err, fileStats) {
        var biggerFile = _.max(fileStats, function (fileStat) {
          return fileStat.stat.size;
        });
        cb(null, biggerFile.file);
      });
    });
  },

  processFile: function (file) {
    var self = this;
    organizer.move(file, this.destpath, function (err, movedFile) {
      if (movedFile) {
        console.log("Move " + file + " to " + movedFile);
        self.downloadSubtitles(movedFile);
      }
    });
  },

  downloadSubtitles: function (file) {
    var options = {
      filepath: file,
      languages: ["eng", "spa"],
      mix: true
    };
    subtitlesDownloader(options, function (err) {
      if (err) return console.error(err);
      console.log("Subtitles downloaded");
    });
  }

};

var watcher = function (basepath, destpath) {
  return new Watcher(basepath, destpath);
};

module.exports = watcher;