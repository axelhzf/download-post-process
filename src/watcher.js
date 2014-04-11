var gaze = require("gaze");
var organizer = require("./organizer");
var subtitlesDownloader = require("subtitles-downloader");
var _ = require("underscore");

var GLOB = "*.+(mkv|avi|mp4)";

function watcher(basepath, destpath) {
  console.log(basepath, destpath);

  console.log("watching " + basepath + "/" + GLOB);

  gaze(GLOB, {cwd : basepath},function () {
    // wait until copy finish
    var debouncedProcessFile = _.debounce(function (filepath) {
      console.log("event!");
      processFile(filepath, destpath);
    }, 3000);

    this.on("added", debouncedProcessFile);
    this.on("changed", debouncedProcessFile);
  });
}

function processFile(filepath, destpath) {
  organizer.move(filepath, destpath, function (err, destfilepath) {
    if (destfilepath) {
      console.log("Move " + filepath + " to " + destfilepath);
      downloadSubtitles(destfilepath);
    }
  });
}

function downloadSubtitles (filepath) {
  var options = {
    filepath : filepath,
    languages : ["eng", "spa"],
    mix : true
  };
  subtitlesDownloader(options, function (err) {
    if (err) return console.error(err);

    console.log("Subtitles downloaded");
  });
}


module.exports = watcher;