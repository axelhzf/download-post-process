var fs = require("fs");
var expect = require("chai").expect;
var organizer = require("../src/organizer");
var temp = require("temp");
var async = require("async");


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
      createTemporaryDestPath(done);
    });

    it("should move files", function (done) {
      async.series([
        testMoveFile("Game.of.Thrones.S04E01.720p.HDTV.x264-KILLERS.mkv", dest[0]),
        testMoveFile("asdlfkjasdfñGaMe.Of.ThroNes.S04E01.720p.HDTV.x264-KILLERS.mkv", dest[0]),
        testMoveFile("Two.and.a.Half.Men.S11E02.720p.HDTV.X264-DIMENSION", dest[3]),
        testMoveFile("Mom.S01E20.HDTV.x264-LOL.mp4", dest[2]),
        testMoveFile("Spiderman", undefined)
      ], done);
    });

    function testMoveFile (fileName, expectedPath) {
      return function (cb) {
        createTemporaryFile(fileName);
        organizer.move(fileName, tempPath, function (err, result) {
          if (expectedPath) {
            expect(result).to.eql(tempPath + "/" + expectedPath + "/" + fileName);
          } else {
            expect(result).is.undefined;
          }
          cb();
        });
      }
    }

    function createTemporaryDestPath (cb) {
      temp.mkdir("move", function (err, info) {
        tempPath = info;

        var absolutePaths = dest.map(function (directory) {
          return tempPath + "/" + directory;
        });

        absolutePaths.forEach(fs.mkdirSync);

        cb(null, absolutePaths);
      });
    }

    function createTemporaryFile (name) {
      var fd = fs.openSync(tempPath + "/" + name, 'w');
      fs.close(fd);
    }
  });

});