releasecast
===========

A tool to help you get from app to release.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/releasecast.svg)](https://npmjs.org/package/releasecast)
[![Downloads/week](https://img.shields.io/npm/dw/releasecast.svg)](https://npmjs.org/package/releasecast)
[![License](https://img.shields.io/npm/l/releasecast.svg)](https://github.com/superhighfives/releasecast/blob/master/package.json)

* [Usage](#usage)
* [Commands](#commands)

# Usage
```sh-session
$ npm install -g releasecast
$ releasecast App.app
running command...
$ releasecast (-v|--version|version)
releasecast/0.0.0 darwin-x64 node-v12.16.3
$ releasecast --help [COMMAND]
USAGE
  $ releasecast App.app
...
```

# Commands
```
-e, --email       Apple Developer email (required)
-r, --releases    Folder of releases to make deltas with
-o, --output      Output folder
-t, --title       Release title
-c, --clean       Clean Sparkle cache (warning: cleans all Sparkle cache)
-d, --dry         Don't upload DMG to Apple's servers

-v, --version     Version
-h, --help        Help
```
