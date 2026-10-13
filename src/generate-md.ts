const fs = require('fs').promises
const xml2js = require('xml2js')

function parseJSON(release: any, title: string, beta = false) {
  return `---
title: ${title}
date: ${release.date}
signature: ${release.signature}
size: ${release.size}
build: ${release.build}
system: ${release.systemVersion}
${beta ? 'beta: true\n' : ''}${release.deltas ? `delta:${release.deltas && release.deltas.map((delta: any) => {
  return `
  - from: ${delta.from}
    size: ${delta.size}
    signature: ${delta.signature}`
}).join('')}
---` : '---'}`
}

export function parseXML(xml: { rss: { channel: any[] } }) {
  const channel = xml.rss.channel[0]
  const {item} = channel

  const release = item[0]
  const details = release.enclosure[0].$

  // Sparkle 2 writes the versions as <item> elements; Sparkle 1 wrote them as
  // enclosure attributes.
  const build =
    (release['sparkle:version'] && release['sparkle:version'][0]) ||
    details['sparkle:version']
  const shortVersion =
    (release['sparkle:shortVersionString'] &&
      release['sparkle:shortVersionString'][0]) ||
    details['sparkle:shortVersionString']

  if (!build || release.title[0] !== shortVersion) {
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
    .sort((a: any, b: any) => Number(b.from) - Number(a.from))

  return {
    version: release.title[0],
    date: release.pubDate[0],
    systemVersion: release['sparkle:minimumSystemVersion'][0],
    build,
    size: details.length,
    signature: details['sparkle:edSignature'],
    ...(deltas && {deltas}),
  }
}

export async function parseAppcast(data: any) {
  return xml2js
  .parseStringPromise(data)
  .then((result: any) => result)
}

export default async function generateMarkdown(url: string, title = '', beta = false) {
  const rawFile = await fs.readFile(url, 'utf8')
  const appcast = await parseAppcast(rawFile)
  const json = parseXML(appcast)

  const markdown = parseJSON(json, title, beta)
  return markdown
}
