# ✨ Releasecast

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/releasecast.svg)](https://npmjs.org/package/releasecast)
[![Downloads/week](https://img.shields.io/npm/dw/releasecast.svg)](https://npmjs.org/package/releasecast)
[![License](https://img.shields.io/npm/l/releasecast.svg)](https://github.com/superhighfives/releasecast/blob/master/package.json)

<img width="780" alt="A screenshot of releasecast in progress" src="https://user-images.githubusercontent.com/449385/104969449-57789a00-59e0-11eb-8ee2-eeb279ed4123.png">

[Releasecast](https://www.npmjs.com/package/releasecast) is a command line tool, built with [Shellac](https://www.npmjs.com/package/shellac), to help you get from a Mac .app (like [Pika](https://superhighfives.com/pika)) to release.

It requires a .app file as an input along with your Apple Developer email [and a password in your keychain](https://developer.apple.com/documentation/xcode/notarizing_macos_software_before_distribution/customizing_the_notarization_workflow#3087734), and optionally, a folder of previous releases, and generates a dmg, notorizes it via Apple, generates Sparkle project data in markdown format, and creates deltas that can be used as part of a release pipeline.

This set up is pretty specific to my needs, as I use the markdown to generate the appcast feed in NextJS. That said, the source code may be useful to someone else, so here we are.

Releasecast is made up of four key steps:

## ⚡️ 1. Processing DMG

**Dependencies:**
- [`ditto`](https://ss64.com/osx/ditto.html) (macOS native)
- [`create-dmg`](https://github.com/sindresorhus/create-dmg)

## ⚡️ 2. Notarising DMG with Apple

**Dependencies:**
- `xcrun altool` (via [XCode / Command Line Tools](https://developer.apple.com/downloads/))

## ⚡️ 3. Generating release files

**Dependencies:**
- `generate_appcast` ([via Sparkle project](https://sparkle-project.org/))

*Note:* Releasecast expects the `generate_appcast` executable to be available, so you'll need to add it to your `$PATH`. There doesn't seem to be a `brew install generate_appcast` or similar, but if you know of a better way to do this I missed, please open an issue.

## ⚡️ 4. Generating metadata

**Dependencies:**
- [Node 12.16.3](https://nodejs.org/en/blog/release/v12.16.3/)

## Output

Releasecast will place the dmg, markdown file, and (if you provided a folder of previous releases) a collection of deltas, into the current directory (or you can pass in your own via the `--output` flag).

---

* [Usage](#usage)
* [Commands](#commands)

# Usage
```sh-session
$ npm install -g releasecast
$ releasecast App.app
running command...
$ releasecast (-v|--version|version)
releasecast/0.0.0 darwin-x64 node-v12.16.3
$ releasecast --help
USAGE
  $ releasecast App.app -e your@email.com
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

For example:
```
$ releasecast Pika.app -e your@email.com -t "Release Title" -r past-releases -o exports
```
