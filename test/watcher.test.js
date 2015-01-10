var fs = require("fs");
var path = require("path");
var fileUtils = require("./fileUtils");
var watcher = require("../src/watcher");
var co = require("co");
var expect = require("chai").expect;
var sinon = require("sinon");
var Promise = require("bluebird");
var organizer = require("../src/organizer");
var subtitlesDownloader = require("subtitles-downloader");

describe("watcher", function () {

  var basepath;
  var destpath;

  beforeEach(function* () {
    basepath = yield fileUtils.createTmpDirectory();
    destpath = yield fileUtils.createTmpDirectory();
  });

  describe("process at start", function () {
    var w;
    var moveStub;

    beforeEach(function () {
      w = watcher(basepath, destpath);
      moveStub = sinon.stub(organizer, "move", function (file) {
        return Promise.resolve(file);
      });
      sinon.stub(subtitlesDownloader, "downloadSubtitle", function () {
        return Promise.resolve("");
      })
    });

    afterEach(function () {
      organizer.move.restore();
      subtitlesDownloader.downloadSubtitle.restore();
    });

    it("should move files", function* () {
      var file1 = "Game.of.Thrones.S01E02.LOL.mkv";
      var file2 = "two.and.a.half.man.S01E02.LOL.mp4";
      fileUtils.createTmpFile(path.join(basepath, file1));
      fileUtils.createTmpFile(path.join(basepath, file2));

      var files = yield executeWatcher();
      expect(files).to.eql([
        path.join(basepath, file1),
        path.join(basepath, file2)
      ]);
    });

    it("should process all files in a folder", function* () {
      var dir = path.join(basepath, "Game.of.Thrones.S01E02.LOL");
      fs.mkdirSync(dir);
      var file1 = "Game.of.Thrones.S01E02.LOL.mkv";
      var file2 = "two.and.a.half.man.S01E02.LOL.mp4";
      fileUtils.createTmpFile(path.join(dir, file1));
      fileUtils.createTmpFile(path.join(dir, file2));

      var files = yield executeWatcher();
      expect(files).to.eql([
        path.join(dir, file1),
        path.join(dir, file2)
      ]);
      expect(fs.existsSync(dir)).to.be.false; //remove folder
    });

    it("should process all files in nested directories", function * () {
      var dir = path.join(basepath, "a");
      fs.mkdirSync(dir);
      var file1 = "Game.of.Thrones.S01E02.LOL.mkv";
      var file2 = "two.and.a.half.man.S01E02.LOL.mp4";
      fileUtils.createTmpFile(path.join(dir, file1));
      var dir2 = path.join(dir, "b");
      fs.mkdirSync(dir2);
      fileUtils.createTmpFile(path.join(dir2, file2));

      var files = yield executeWatcher();
      expect(files).to.eql([
        path.join(dir, file1),
        path.join(dir2, file2)
      ]);
      expect(fs.existsSync(dir)).to.be.false; //remove folder
    });

    it("should keep the directory if it doesn't contains a video file", function * () {
      var dir = path.join(basepath, "Game.of.Thrones.S01E02.LOL");
      fs.mkdirSync(dir);
      var file1 = "Game.of.Thrones.S01E02.LOL.zip";
      fileUtils.createTmpFile(path.join(dir, file1));

      var files = yield executeWatcher();
      expect(files).to.eql([]);
      expect(fs.existsSync(dir)).to.be.true;
    });

    it("should skip sample videos", function* () {
      var file1 = "Game.of.Thrones.S01E02.LOL.mkv";
      var file2 = "Game.of.Thrones.S01E02.sample.LOL.mkv";
      fileUtils.createTmpFile(path.join(basepath, file1));
      fileUtils.createTmpFile(path.join(basepath, file2));

      var files = yield executeWatcher();
      expect(files).to.eql([
        path.join(basepath, file1)
      ]);
    });

    function executeWatcher() {
      return new Promise(function (resolve, reject) {
        w.start();
        w.stop();

        w.events.on("initialized", function () {
          var parameters = [];
          var totalCount = moveStub.callCount;
          for (var i = 0; i < totalCount; i++) {
            parameters.push(moveStub.getCall(i).args[0]);
          }
          resolve(parameters);
        });
      });
    }


  });


});