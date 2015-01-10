var fs = require("fs");
var path = require("path");
var expect = require("chai").expect;
var organizer = require("../src/organizer");
var temp = require("temp");
var co = require("co");
var thunkify = require("thunkify");
var move = thunkify(organizer.move);
var fileUtils = require("./fileUtils");
require("co-mocha");

describe("Organizer", function () {

  describe("move", function () {

    it("should a tvshow file", function* () {
      var tempFolder = yield fileUtils.createTmpDirectory("move");
      var file = "Game.of.Thrones.S04E01.720p.HDTV.x264-KILLERS.mkv";
      var tempFile = path.join(tempFolder, file);
      fileUtils.createTmpFile(tempFile);
      var movedFile = yield move(tempFile, tempFolder);
      expect(movedFile).to.equal(path.join(tempFolder, "tvshows", "Game.of.Thrones", file));
    });

    it("should a movie file", function* () {
      var tempFolder = yield fileUtils.createTmpDirectory("move");
      var file = "Guardians.of.the.galaxy.mkv";
      var tempFile = path.join(tempFolder, file);
      fileUtils.createTmpFile(tempFile);
      var movedFile = yield move(tempFile, tempFolder);
      expect(movedFile).to.equal(path.join(tempFolder, "movies", file));
    });


  });

  describe("showFromPath", function () {
    it("should extract showName", function () {
      expectTvShowWithNormalized("Game.of.Thrones.S01E12", "Game.of.Thrones");
      expectTvShowWithNormalized("game Of thrones S01E12", "Game.of.Thrones");
      expectTvShowWithNormalized("GaMe.Of.ThRoNes.S01E12", "Game.of.Thrones");
      expectTvShowWithNormalized("/home/user/path/show/game.of.thrones.S01E12", "Game.of.Thrones");
      expectTvShowWithNormalized("two.and.a.half.men.S01E12", "Two.and.a.Half.Men");
      expectMovie("Guardians.of.the.Galaxy");
    });
  });

  function expectTvShowWithNormalized(input, expectedNormalized) {
    var item = organizer.guestItem(input);
    expect(item.type).equals("tvshow");
    expect(item.normalizedName).equals(expectedNormalized);
  }

  function expectMovie(input) {
    var item = organizer.guestItem(input);
    expect(item.type).equals("movie");
  }


});