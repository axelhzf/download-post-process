var program = require("commander");
var watcher = require("./watcher");

var version = require("./../package.json").version;
program
  .version(version)
  .option("-s, --source <path>", "Source")
  .option("-d, --dest <path>", "Destination")
  .parse(process.argv);

watcher(program.source, program.dest);