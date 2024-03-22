# ✨ Releasecast

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/releasecast.svg)](https://npmjs.org/package/releasecast)
[![Downloads/week](https://img.shields.io/npm/dw/releasecast.svg)](https://npmjs.org/package/releasecast)
[![License](https://img.shields.io/npm/l/releasecast.svg)](https://github.com/superhighfives/releasecast/blob/master/package.json)

<img width="780" alt="A screenshot of releasecast in progress" src="https://user-images.githubusercontent.com/449385/104969449-57789a00-59e0-11eb-8ee2-eeb279ed4123.png">

[Releasecast](https://www.npmjs.com/package/releasecast) is a command line tool, built with [Shellac](https://www.npmjs.com/package/shellac), to help you get from a Mac .app (like [Pika](https://superhighfives.com/pika)) to release.

It requires a .app file as an input along with your Apple Developer email [and a password in your keychain](https://developer.apple.com/documentation/xcode/notarizing_macos_software_before_distribution/customizing_the_notarization_workflow#3087734), and optionally, a folder of previous releases, and generates a dmg, notorizes it via Apple, generates Sparkle project data in markdown format, and creates deltas that can be used as part of a release pipeline.

This set up is pretty specific to my needs, as I use the markdown to generate the appcast feed in NextJS. That said, the source code may be useful to someone else, so here we are. To really dig into what's happening, [check out the source code](https://github.com/superhighfives/releasecast/blob/main/src/index.ts).

Releasecast is made up of four key steps:

## ⚡️ 1. Processing DMG

**Dependencies:**
- [`ditto`](https://ss64.com/osx/ditto.html) (macOS native)
- [`create-dmg`](https://github.com/sindresorhus/create-dmg)

## ⚡️ 2. Notarising DMG with Apple

**Dependencies:**
- `xcrun notarytool` (via [XCode / Command Line Tools](https://developer.apple.com/downloads/))

## ⚡️ 3. Generating release files

**Dependencies:**
- `generate_appcast` ([via Sparkle project](https://sparkle-project.org/))

*Note:* Releasecast expects the `generate_appcast` executable to be available, so you'll need to add it to your `$PATH`. There doesn't seem to be a `brew install generate_appcast` or similar, but if you know of a better way to do this I missed, please open an issue.

*Note:* Releasecast expects output from Sparkle 1.x—you can find [the latest 1.x version at their GitHub releases](https://github.com/sparkle-project/Sparkle/releases).

## ⚡️ 4. Generating metadata

**Dependencies:**
- [Node 12.16.3](https://nodejs.org/en/blog/release/v12.16.3/)

## Output

Releasecast will place the dmg, appcast.xml, markdown file, and (if you provided a folder of previous releases) a collection of deltas, into the current directory (or you can pass in your own via the `--output` flag).

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
-b, --beta        Add beta flag to markdown output
-d, --dry         Don't upload DMG to Apple's servers
-c, --clean       Clean Sparkle cache (note: clears out the entire Sparkle cache)

-v, --version     Version
-h, --help        Help
```

For example:
```shell
$ releasecast Pika.app -e your@email.com -t "Release Title" -r past-releases -o exports
```

# Usage example

For the exmaple below, let's start with a standard `Appcast.xml`, like the one below:

```xml
<?xml version="1.0" standalone="yes"?>
<rss xmlns:sparkle="http://www.andymatuschak.org/xml-namespaces/sparkle" version="2.0">
    <channel>
        <title>Pika</title>
        <item>
            <title>0.0.8</title>
            <pubDate>Sat, 23 Jan 2021 02:39:00 +0000</pubDate>
            <sparkle:minimumSystemVersion>10.15</sparkle:minimumSystemVersion>
            <enclosure url="Pika-0.0.8.dmg" sparkle:version="11" sparkle:shortVersionString="0.0.8" length="3551889" type="application/octet-stream" sparkle:edSignature="/oXF5GUzo09cGPGxIRRulr54ucNnZwb1XwcvEjpP1BVgk5x+SF8HwqFW1nyEA9NGWES//OwcfrJXHGo2LNR7DA=="/>
            <sparkle:deltas>
                <enclosure url="//Pika11-7.delta" sparkle:version="11" sparkle:shortVersionString="0.0.8" sparkle:deltaFrom="7" length="282332" type="application/octet-stream" sparkle:edSignature="76LUCncDkl/qhlpYni1QHG0YLCyL9BWxT0iSj/44R85+fdfux90QudzMasRG56nDOxF0I16A13Z5NRkGPZl6DA=="/>
                <enclosure url="//Pika11-6.delta" sparkle:version="11" sparkle:shortVersionString="0.0.8" sparkle:deltaFrom="6" length="282430" type="application/octet-stream" sparkle:edSignature="JGaXJlGmo4VK9JwTdpDZ/IwspWNT7ObkyNSQ6UJHnFOIJI5xG4pukoVlJBaLLpUvZaYGutXYPNIY2p5uQaECAg=="/>
                <enclosure url="//Pika11-5.delta" sparkle:version="11" sparkle:shortVersionString="0.0.8" sparkle:deltaFrom="5" length="289512" type="application/octet-stream" sparkle:edSignature="cS+4bwgP1BwHoug1KLHtP5npne/cVKUV9EFxnEOxXpjbdCvZZAvnyhFcBhxGB5P51+56od3ySJo9zUZOC4VPDg=="/>
                <enclosure url="//Pika11-4.delta" sparkle:version="11" sparkle:shortVersionString="0.0.8" sparkle:deltaFrom="4" length="1065098" type="application/octet-stream" sparkle:edSignature="KCe+xbIRHAtaUvg1ufOxIir/pSqejAJx8KVSJ0nnzx3u6Bq0EMIpOn9fIKHjUvj0jXuhPeIrFNDSxLK2kqbaAw=="/>
                <enclosure url="//Pika11-3.delta" sparkle:version="11" sparkle:shortVersionString="0.0.8" sparkle:deltaFrom="3" length="1095844" type="application/octet-stream" sparkle:edSignature="ALvxWWHMMU/7bYCebccGVgro0eRa8ZuAjz2BHNAZJ8UGFXBqzZJIEihlB9fbXTAevUpM6EQom/rEBFe1lPw8Bg=="/>
            </sparkle:deltas>
        </item>
        <!-- More items... -->
    </channel>
</rss>
```

When you run the `releasecast` command it will generate your Appcast.xml, your deltas (if you provide a folder of up to five previous releases), and a Markdown file named after the latest version (here, for example, being `0.0.8.md`):

```shell
$ releasecast App.app -e your@emailaddress.com -t "A Rad New Release"
```

```markdown
---
title: A Rad New Release
date: Sat, 23 Jan 2021 02:39:00 +0000
signature: /oXF5GUzo09cGPGxIRRulr54ucNnZwb1XwcvEjpP1BVgk5x+SF8HwqFW1nyEA9NGWES//OwcfrJXHGo2LNR7DA==
size: 3551889
build: 11
system: 10.15
delta:
  - from: 7
    size: 282332
    signature: 76LUCncDkl/qhlpYni1QHG0YLCyL9BWxT0iSj/44R85+fdfux90QudzMasRG56nDOxF0I16A13Z5NRkGPZl6DA==
  - from: 6
    size: 282430
    signature: JGaXJlGmo4VK9JwTdpDZ/IwspWNT7ObkyNSQ6UJHnFOIJI5xG4pukoVlJBaLLpUvZaYGutXYPNIY2p5uQaECAg==
  - from: 5
    size: 289512
    signature: cS+4bwgP1BwHoug1KLHtP5npne/cVKUV9EFxnEOxXpjbdCvZZAvnyhFcBhxGB5P51+56od3ySJo9zUZOC4VPDg==
  - from: 4
    size: 1065098
    signature: KCe+xbIRHAtaUvg1ufOxIir/pSqejAJx8KVSJ0nnzx3u6Bq0EMIpOn9fIKHjUvj0jXuhPeIrFNDSxLK2kqbaAw==
  - from: 3
    size: 1095844
    signature: ALvxWWHMMU/7bYCebccGVgro0eRa8ZuAjz2BHNAZJ8UGFXBqzZJIEihlB9fbXTAevUpM6EQom/rEBFe1lPw8Bg==
---
```

These values correspond to the following:
- **title:** The title of the release, if provided. Defaults to "New Release". This is not used by Sparkle project, but instead for your own reference / changelog.
- **date:** The date, in `EEE MMM dd HH:mm:ss zzz yyyy` format. For example: Sat, 25 Jan 2021 07:00:00 +0000
- **signature:** An EdDSA (Ed25519) signature, encoded into BASE64 url-file safe format. The encoded signatures are 88 characters in length and include two trailing pad characters =.
- **size:** The file size in bytes. For example, `3551889`.
- **build:** The build number. For example, `11`.
- **system:** The minimum system version supported. For example, `10.15` for Catalina and newer.
- **delta:** An array of up to five deltas, featuring the build number they're updating from, the size in bytes, and the signature.
  - **from:** The build number the delta updates from. For example, `7`.
  - **size:** The file size in bytes. For example, `282332`.
  - **signature:** An EdDSA (Ed25519) signature, encoded into BASE64 url-file safe format. For example, `76LUCncDkl/qhlpYni1QHG0YLCyL9BWxT0iSj/44R85+fdfux90QudzMasRG56nDOxF0I16A13Z5NRkGPZl6DA==`.

These could then be used to regenerate an `Appcast.xml`, and the markdown can be used to create a changelog on your website. For example, in [NextJS](https://nextjs.org/):

```js
const generateRssItem = ({ slug, title, date, content, signature, size, build, system, delta }) => `
  <item>
    <title>v${slug} - ${title}</title>
    <description>
      <![CDATA[${content}]]>
    </description>
    <pubDate>${date}</pubDate>
    <sparkle:minimumSystemVersion>${system}</sparkle:minimumSystemVersion>
    <enclosure url="https://github.com/superhighfives/pika/releases/download/${slug}/Pika-${slug}.dmg"
               sparkle:version="${build}"
               sparkle:shortVersionString="${slug}"
               sparkle:edSignature="${signature}"
               length="${size}"
               type="application/octet-stream" />
    ${
      delta && delta.length
        ? `
      <sparkle:deltas>
        ${delta
          .map((update) => {
            return `
            <enclosure url="https://github.com/superhighfives/pika/releases/download/${slug}/Pika${build}-${update.from}.delta"
                       sparkle:version="${build}"
                       sparkle:shortVersionString="${slug}"
                       sparkle:deltaFrom="${update.from}"
                       length="${update.size}"
                       type="application/octet-stream"
                       sparkle:edSignature="${update.signature}" />
          `
          })
          .join('')}
      </sparkle:deltas>
    `
        : ``
    }
  </item>
`

const generateRss = (posts, options) => `
  <rss xmlns:sparkle="http://www.andymatuschak.org/xml-namespaces/sparkle" xmlns:dc="http://purl.org/dc/elements/1.1/" version="2.0">
    <channel>
      <title>Pika Releases</title>
      <link>${url}/releases/pika</link>
      <description>Releases for Pika, an open-source colour picker app for macOS</description>
      <language>en</language>
      ${posts.map((post) => generateRssItem(post, options)).join('')}
    </channel>
  </rss>
`
```

You could also grab the latest version of the app from the collection of markdown files, ignoring any beta releases (if you tagged them as such in the front matter of the markdown file). The following is based on NextJS' [statically generated blog example using Next.js and Markdown](https://github.com/vercel/next.js/tree/canary/examples/blog-starter):

```js
import getAllChangelogs from './getChangelogs'
import round from 'lodash/round'
import dayjs from 'dayjs'

export default async (slug) => {
  const changelogs = await getAllChangelogs(slug, ['title', 'date', 'slug', 'size', 'system'])
  const changelog = changelogs[0] // grab the latest release

  return {
    version: changelog['slug'],
    metadata: {
      size: `${round(changelog['size'] / 1000000, 2)}MB`,
      released: dayjs(changelog['date']).format('DD/MM/YYYY'),
      version: `v${changelog['slug']} (${changelog['title']})`,
      macOS: `${changelog['system']}+ required`,
    },
  }
}
```

You can see an example of these ideas in action at https://superhighfives.com/pika, and you can see the output `Appcast.xml` at https://superhighfives.com/releases/pika/
