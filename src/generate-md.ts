const fs = require('fs').promises
const xml2js = require('xml2js')

function parseJSON(release: any, title: string) {
  return `---
title: ${title}
date: ${release.date}
signature: ${release.signature}
size: ${release.size}
build: ${release.build}
system: ${release.systemVersion}
${release.deltas ? `delta:${release.deltas && release.deltas.map((delta: any) => {
    return `
  - from: ${delta.from}
    size: ${delta.size}
    signature: ${delta.signature}`
  }).join('')}
---` : '---'}`
}

async function parseXML(xml: { rss: { channel: any[] } }) {
  const channel = xml.rss.channel[0]
  const {item} = channel

  const release = item[0]
  const details = release.enclosure[0].$

  if (release.title[0] !== details['sparkle:shortVersionString']) {
    throw new Error('Version weirdness?')
  }

  const deltaData =
    release['sparkle:deltas'] && release['sparkle:deltas'][0].enclosure

  const deltas = deltaData &&
    deltaData
    .map((deltaRef: { $: any }) => {
      const delta = deltaRef.$
      return {
        from: delta['sparkle:deltaFrom'],
        size: delta.length,
        signature: delta['sparkle:edSignature'],
      }
    })
    .sort((a: any, b: any) => (a.from < b.from ? 1 : -1))

  return {
    version: release.title[0],
    date: release.pubDate[0],
    systemVersion: release['sparkle:minimumSystemVersion'][0],
    build: details['sparkle:version'],
    size: details.length,
    signature: details['sparkle:edSignature'],
    ...(deltas && {deltas}),
  }
}

async function parseAppcast(data: any) {
  return xml2js
  .parseStringPromise(data)
  .then((result: any) => result)
}

export default async function generateMarkdown(url: string, title?: string) {
  const rawFile = await fs.readFile(url, 'utf8')
  const appcast = await parseAppcast(rawFile)
  const json = await parseXML(appcast)

  const markdown = parseJSON(json, title || '')
  return markdown
}
