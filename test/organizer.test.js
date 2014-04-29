var fs = require("fs");
var expect = require("chai").expect;
var organizer = require("../src/organizer");
var temp = require("temp");
var async = require("async");
var co = require("co");
var thunkify = require("thunkify");
var _ = require("underscore");

var move = thunkify(organizer.move);
var mkTempDir = thunkify(temp.mkdir);
var mkdir = thunkify(fs.mkdir);

describe("Organizer", function () {

  var dest = [
    "Game.of.thrones",
    "House.of.cards",
    "Mom",
    "Two.and.a.half.men",
    "Modern.Family"
  ];

  describe("move", function () {
    var tempPath;

    beforeEach(function (done) {
      co(function* () {
        yield createTemporaryDestPath();
      })(done);
    });

    it("should move files", function (done) {
      co(function* () {
        var tests = [
          testMoveFile("Game.of.Thrones.S04E01.720p.HDTV.x264-KILLERS.mkv", dest[0]),
          testMoveFile("asdlfkjasdfñGaMe.Of.ThroNes.S04E01.720p.HDTV.x264-KILLERS.mkv", dest[0]),
          testMoveFile("Two.and.a.Half.Men.S11E02.720p.HDTV.X264-DIMENSION", dest[3]),
          testMoveFile("Mom.S01E20.HDTV.x264-LOL.mp4", dest[2]),
          testMoveFile("Spiderman", undefined)
        ];
        yield tests;
      })(done);
    });

    function* testMoveFile (fileName, expectedPath) {
      var temporaryFile = createTemporaryFile(fileName);
      var result = yield move(temporaryFile, tempPath);
      var expected = _.isUndefined(expectedPath) ? undefined : tempPath + "/" + expectedPath + "/" + fileName;
      expect(result).to.equal(expected);
    }

    function* createTemporaryDestPath () {
      tempPath = yield mkTempDir("move");
      var absolutePaths = dest.map(function (directory) {
        return tempPath + "/" + directory;
      });
      yield absolutePaths.map(function (path) {
        return mkdir(path)
      });
      return absolutePaths;
    }

    function createTemporaryFile (name) {
      var fullPath = tempPath + "/" + name;
      var fd = fs.openSync(tempPath + "/" + name, 'w');
      fs.close(fd);
      return fullPath;
    }
  });

});