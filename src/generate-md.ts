import {promises as fs} from 'fs'

const xml2js = require('xml2js')

interface Delta {
  from: string;
  size: string;
  signature: string;
}

interface Release {
  version: string;
  date: string;
  systemVersion: string;
  build: string;
  size: string;
  signature: string;
  deltas?: Delta[];
}

// xml2js gives each element as an object whose children are arrays, with
// attributes under `$`. The appcast comes from a file on disk, so nothing about
// its shape is assumed.
type XMLNode = { [key: string]: unknown }

function isNode(value: unknown): value is XMLNode {
  return typeof value === 'object' && value !== null
}

function children(node: XMLNode, name: string): unknown[] {
  const value = node[name]
  return Array.isArray(value) ? value : []
}

function child(node: XMLNode, name: string): XMLNode | undefined {
  const [first] = children(node, name)
  return isNode(first) ? first : undefined
}

function text(node: XMLNode, name: string): string | undefined {
  const [first] = children(node, name)
  return typeof first === 'string' && first !== '' ? first : undefined
}

function attribute(node: XMLNode, name: string): string | undefined {
  const attributes = node.$
  const value = isNode(attributes) ? attributes[name] : undefined
  return typeof value === 'string' && value !== '' ? value : undefined
}

function required<T>(value: T | undefined, description: string): T {
  if (value === undefined) {
    throw new Error(`Appcast is missing ${description}`)
  }
  return value
}

function parseJSON(release: Release, title: string, beta = false) {
  return `---
title: ${title}
date: ${release.date}
signature: ${release.signature}
size: ${release.size}
build: ${release.build}
system: ${release.systemVersion}
${beta ? 'beta: true\n' : ''}${release.deltas ? `delta:${release.deltas.map(delta => {
  return `
  - from: ${delta.from}
    size: ${delta.size}
    signature: ${delta.signature}`
}).join('')}
---` : '---'}`
}

export function parseXML(xml: unknown): Release {
  const rss = required(isNode(xml) && isNode(xml.rss) ? xml.rss : undefined, 'an <rss> element')
  const channel = required(child(rss, 'channel'), 'a <channel>')
  const release = required(child(channel, 'item'), 'an <item>')
  const enclosure = required(child(release, 'enclosure'), 'an <enclosure> for the latest item')

  const version = required(text(release, 'title'), 'a <title> for the latest item')

  // Sparkle 2 writes the versions as <item> elements; Sparkle 1 wrote them as
  // enclosure attributes.
  const build = required(
    text(release, 'sparkle:version') || attribute(enclosure, 'sparkle:version'),
    `sparkle:version for ${version}`,
  )
  const shortVersion = required(
    text(release, 'sparkle:shortVersionString') || attribute(enclosure, 'sparkle:shortVersionString'),
    `sparkle:shortVersionString for ${version}`,
  )

  if (version !== shortVersion) {
    throw new Error(`Appcast title "${version}" doesn't match sparkle:shortVersionString "${shortVersion}" (build ${build})`)
  }

  const deltaList = child(release, 'sparkle:deltas')
  const deltas = deltaList &&
    children(deltaList, 'enclosure')
    .map((delta): Delta => {
      if (!isNode(delta)) {
        throw new Error(`Appcast has an empty delta <enclosure> for ${version}`)
      }
      const from = required(attribute(delta, 'sparkle:deltaFrom'), `sparkle:deltaFrom on a delta for ${version}`)
      return {
        from,
        size: required(attribute(delta, 'length'), `length on the delta from ${from}`),
        signature: required(attribute(delta, 'sparkle:edSignature'), `sparkle:edSignature on the delta from ${from}`),
      }
    })
    // Newest first. Numeric-aware, so 100 sorts above 97 and 1.2.10 above 1.2.9.
    .sort((a, b) => b.from.localeCompare(a.from, undefined, {numeric: true}))

  return {
    version,
    date: required(text(release, 'pubDate'), `a <pubDate> for ${version}`),
    systemVersion: required(text(release, 'sparkle:minimumSystemVersion'), `sparkle:minimumSystemVersion for ${version}`),
    build,
    size: required(attribute(enclosure, 'length'), `length on the enclosure for ${version}`),
    signature: required(attribute(enclosure, 'sparkle:edSignature'), `sparkle:edSignature on the enclosure for ${version}`),
    ...(deltas && {deltas}),
  }
}

async function parseAppcast(data: string): Promise<unknown> {
  return xml2js.parseStringPromise(data)
}

export default async function generateMarkdown(url: string, title = '', beta = false) {
  const rawFile = await fs.readFile(url, 'utf8')
  const appcast = await parseAppcast(rawFile)
  const json = parseXML(appcast)

  const markdown = parseJSON(json, title, beta)
  return markdown
}
