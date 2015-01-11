# Video organizer

Module that organize video files (movies and tvshows) into a folder structure


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
  basePath : "/basePath/",
  destPath : "/destPath/"
};
var videoOrganizer = new VideoOrganizer(options);
videoOrganizer.start();

//videoOrganizer listen to files changes to be processed

videoOrganizer.stop();
```

VideoOrganizer is and EventEmitter that emits these events:

* `initialized` - VideoOrganizer process all files on start. When finish processing all files emit this event.
* `processedFile(file)` - File processed

## Debug

```
DEBUG=video-organizer
```

## Test

```js
npm test
```



