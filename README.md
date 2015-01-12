# Video organizer

Organize your movies and tvshows

## Platform Compatibility

When using node 0.11.x or greater, you must use the --harmony-generators flag or just --harmony to get access to generators.

When using node 0.10.x and lower or browsers without generator support, you must use gnode and/or regenerator.


## Installation

```
npm install video-organizer
```

## Usage

```js
var VideoOrganizer = require("video-organizer");
var options = {
  srcPath : "~/downloads/",
  destPath : "~/videos/"
};
var videoOrganizer = new VideoOrganizer(options);
videoOrganizer.start();

//videoOrganizer listen to files changes to be processed

videoOrganizer.on("initialized", function () {

});

videoOrganizer.on("processedFile", function (e) {

});

videoOrganizer.stop();
```

Base directory

```
.
`-- downloads
    |-- Game.of.Thrones.S01E11.mkv
    |-- Game.of.Thrones.S01E12.mkv
    |-- Guardians.of.the.Galaxy.mp4
    `-- two.and.a.half.men.S01E12.mkv
```

Destination directory

```
.
`-- videos
    |-- movies
    |   `-- Guardians.of.the.Galaxy.mp4
    `-- tvshows
        |-- Game.of.Thrones
        |   |-- Game.of.Thrones.S01E11.mkv
        |   `-- Game.of.Thrones.S01E12.mkv
        `-- Two.and.a.Half.Men
            `-- two.and.a.half.men.S01E12.mkv
```

## Api

**VideoOrganizer(options)**

* basePath
* destPath


VideoOrganizer is and EventEmitter that emits these events:

* `initialized` - VideoOrganizer process all files on start. When finish processing all files emit this event.
* `processedFile({src, dest})` - File processed

## Debug

```
DEBUG=video-organizer
```

## Test

```js
npm test
```



