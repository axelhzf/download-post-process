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
    "Two.and.a.half.men"
  ];

  function testFindDestination (input, expected) {
    expect(organizer.findDestination(input, dest)).to.eql(expected);
  }

  it("should find destination", function () {
    testFindDestination("Game.of.Thrones.S04E01.720p.HDTV.x264-KILLERS.mkv", dest[0]);
    testFindDestination("asdlfkjasdfñGaMe.Of.ThroNes.S04E01.720p.HDTV.x264-KILLERS.mkv", dest[0]);
    testFindDestination("Two.and.a.Half.Men.S11E02.720p.HDTV.X264-DIMENSION", dest[3]);
    testFindDestination("Spiderman", undefined);
  });


  describe("move", function () {
    var tempPath;
    var destAbs;

    beforeEach(function (done) {
      createTemporaryDestPath(function (err, directories) {
        destAbs = directories;
        done();
      });
    });

    it("should move files", function (done) {
      async.series([
        testMoveFile("Game.of.Thrones.S04E01.720p.HDTV.x264-KILLERS.mkv", dest[0]),
        testMoveFile("asdlfkjasdfñGaMe.Of.ThroNes.S04E01.720p.HDTV.x264-KILLERS.mkv", dest[0]),
        testMoveFile("Two.and.a.Half.Men.S11E02.720p.HDTV.X264-DIMENSION", dest[3]),
        testMoveFile("Spiderman", undefined)
      ], done);
    });

    function testMoveFile (fileName, expectedPath) {
      return function (cb) {
        createTemporaryFile(fileName);
        organizer.move(fileName, tempPath, function (err, result) {
          console.log(result);
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

        var destAbs = dest.map(function (directory) {
          return tempPath + "/" + directory;
        });


        destAbs.forEach(fs.mkdirSync);

        cb(null, destAbs);
      });
    }

    function createTemporaryFile (name) {
      var fd = fs.openSync(tempPath + "/" + name, 'w');
      fs.close(fd);
    }
  });

});