var fs = require("fs");
var path = require("path");
var fileUtils = require("./fileUtils");
var Watcher = require("../src/watcher");
var expect = require("chai").expect;
var sinon = require("sinon");
var Promise = require("bluebird");
var organizer = require("../src/organizer");

describe("watcher", function () {
  var sandbox;

  var basepath;
  var destpath;
  var moveStub;
  var w;

  beforeEach(function* () {
    basepath = yield fileUtils.createTmpDirectory();
    destpath = yield fileUtils.createTmpDirectory();
    sandbox = sinon.sandbox.create();

    moveStub = sandbox.stub(organizer, "move", function (file) {
      var destinationFile = path.join(destpath, path.basename(file))
      console.log("destination", destinationFile);
      return new Promise(function (resolve) {
        resolve(destinationFile);
      });
    });

    var options = {
      srcPath: basepath,
      destPath: destpath
    };
    w = new Watcher(options);

  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("process at start", function () {

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

        w.on("initialized", function () {
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

  describe("on fs event", function () {

    it("should move files", function* (done) {
      var file = "Game.of.Thrones.S01E02.LOL.mkv";

      w.on("initialized", function () {
        fileUtils.createTmpFile(path.join(basepath, file));
      });

      w.on("processedFile", function (e) {
        expect(e.src).to.eql(path.join(basepath, file));
        expect(e.dest).to.eql(path.join(destpath, file));
        done();
      });

      w.start();
    });

  });

});