var fs = require("fs");
var path = require("path");
var fileUtils = require("./fileUtils");
var watcher = require("../src/watcher");
var co = require("co");
var expect = require("chai").expect;
var sinon = require("sinon");

describe("watcher", function () {

  var basepath;
  var destpath;

  beforeEach(function* () {
    basepath = yield fileUtils.createTmpDirectory();
    destpath = yield fileUtils.createTmpDirectory();
  });

  describe("process at start", function () {
    var w;
    var processStub;

    beforeEach(function () {
      w = watcher(basepath, destpath);
      processStub = sinon.stub(w, "processFile", function *(file) {
        console.log("process file", file);
        return "";
      });
    });


    it("should move files", function (done) {
      var file1 = "Game.of.Thrones.S01E02.LOL.mkv";
      var file2 = "two.and.a.half.man.S01E02.LOL.mp4";
      fileUtils.createTmpFile(path.join(basepath, file1));
      fileUtils.createTmpFile(path.join(basepath, file2));

      w.start();
      w.stop();

      w.events.on("initialized", function () {
        console.log("initialized");

        expect(processStub.calledTwice);
        expect(processStub.getCall(0).args[0]).to.equal(path.join(basepath, file1));
        expect(processStub.getCall(1).args[0]).to.equal(path.join(basepath, file2));

        done();
      });
    });

    it("should move bigger file in folder", function (done) {
      var dir = path.join(basepath, "Game.of.Thrones.S01E02.LOL");
      fs.mkdirSync(dir);
      var file1 = "Game.of.Thrones.S01E02.LOL.mkv";
      var file2 = "two.and.a.half.man.S01E02.LOL.mp4";
      fileUtils.createTmpFile(path.join(dir, file1));
      fileUtils.createTmpFile(path.join(dir, file2), 1000);

      w.start();
      w.stop();

      w.events.on("initialized", function () {
        expect(processStub.calledOnce);
        expect(processStub.getCall(0).args[0]).to.equal(path.join(dir, file2));
        expect(fs.existsSync(dir)).to.be.false; //remove folder

        done();
      });


    });


  });


});