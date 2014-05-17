var fs = require("fs");
var path = require("path");
var expect = require("chai").expect;
var organizer = require("../src/organizer");
var temp = require("temp");
var co = require("co");
var thunkify = require("thunkify");

var move = thunkify(organizer.move);
var fileUtils = require("./fileUtils");

describe("Organizer", function () {

  describe("move", function () {

    it("should move files", function (done) {
      co(function* () {
        var tempFolder = yield fileUtils.createTmpDirectory("move");
        var file = "Game.of.Thrones.S04E01.720p.HDTV.x264-KILLERS.mkv";
        var tempFile = path.join(tempFolder, file);
        fileUtils.createTmpFile(tempFile);
        var movedFile = yield move(tempFile, tempFolder);
        expect(movedFile).to.equal(path.join(tempFolder, "Game.of.Thrones", file));
      })(done);
    });

  });
  
  describe("showFromPath", function () {
    it("should extract showName", function () {
      expect(organizer.showFromPath("Game.of.Thrones.S01E12")).to.equal("Game.of.Thrones");
      expect(organizer.showFromPath("game.of.thrones.S01E12")).to.equal("Game.of.Thrones");
      expect(organizer.showFromPath("game Of thrones S01E12")).to.equal("Game.of.Thrones");
      expect(organizer.showFromPath("GaMe.Of.ThRoNes.S01E12")).to.equal("Game.of.Thrones");
      expect(organizer.showFromPath("/home/user/path/show/game.of.thrones.S01E12")).to.equal("Game.of.Thrones");
      expect(organizer.showFromPath("two.and.a.half.men.S01E12")).to.equal("Two.and.a.Half.Men");
      expect(organizer.showFromPath("two.and.a.half.men")).to.be.undefined;
    });
  });

});