const assert = require('assert')
const path = require('path')
const {test} = require('node:test')

require('ts-node').register({project: path.join(__dirname, '../tsconfig.json')})
const {default: generateMarkdown, parseXML} = require('../src/generate-md')

const fixture = name => path.join(__dirname, 'fixtures', name)

// Both fixtures are generate_appcast output for the same pair of DMGs
// (Pika 2.0.0 with a delta from 1.9.0): one from Sparkle 1.27.1, one from 2.10.0.
test('parses a Sparkle 1 appcast (versions as enclosure attributes)', async () => {
  const markdown = await generateMarkdown(fixture('sparkle-1.xml'), 'Title')
  assert.strictEqual(markdown, `---
title: Title
date: Sun, 11 Oct 2026 00:10:43 -0700
signature: atxeD/9hXXxTCyjkgWN510CJOT/QZQ0DBqRT/2RelS2kgKWQ9NRBGP7rb+xIZXm4DFLcRJiAp1VBinVqlPn0Cg==
size: 8357050
build: 105
system: 14.0
delta:
  - from: 97
    size: 3899841
    signature: RcdDUtJOMpFtvQqQxPgJaef/vutWcQ+rfgVVRO2sM/6Y4PV6kEUP9RZPw6VqGJOZQX5LlUQKFQMscXcMUWaNDw==
---`)
})

test('parses a Sparkle 2 appcast (versions as item elements)', async () => {
  const markdown = await generateMarkdown(fixture('sparkle-2.xml'), 'Title', true)
  assert.strictEqual(markdown, `---
title: Title
date: Sun, 11 Oct 2026 22:04:07 -0700
signature: atxeD/9hXXxTCyjkgWN510CJOT/QZQ0DBqRT/2RelS2kgKWQ9NRBGP7rb+xIZXm4DFLcRJiAp1VBinVqlPn0Cg==
size: 8357050
build: 105
system: 14.0
beta: true
delta:
  - from: 97
    size: 3899619
    signature: cd1QvVgRX96hlu67+dPKGFs7x7HUp54zzH0PfVO0qIWQ43/bdmBGP0byC5t7j6EUFMu5rN/lo4uR7gDcRYHQBA==
---`)
})

// The shape xml2js gives for a Sparkle 2 appcast with one item.
function appcast(item = {}, enclosure = {}) {
  return {rss: {channel: [{item: [{
    title: ['2.0.0'],
    pubDate: ['Sun, 11 Oct 2026 22:04:07 -0700'],
    'sparkle:version': ['105'],
    'sparkle:shortVersionString': ['2.0.0'],
    'sparkle:minimumSystemVersion': ['14.0'],
    enclosure: [{$: {length: '8357050', 'sparkle:edSignature': 'c2ln', ...enclosure}}],
    ...item,
  }]}]}}
}

const delta = from => ({$: {'sparkle:deltaFrom': from, length: '1', 'sparkle:edSignature': 'c2ln'}})
const deltasFrom = (...builds) => parseXML(appcast({
  'sparkle:deltas': [{enclosure: builds.map(delta)}],
})).deltas.map(({from}) => from)

test('rejects an appcast with no build number', () => {
  assert.throws(
    () => parseXML(appcast({'sparkle:version': undefined})),
    /missing sparkle:version for 2\.0\.0/,
  )
})

test('rejects a title that differs from the short version, naming both', () => {
  assert.throws(
    () => parseXML(appcast({title: ['2.0.1']})),
    /title "2\.0\.1" doesn't match sparkle:shortVersionString "2\.0\.0" \(build 105\)/,
  )
})

test('names the missing field rather than throwing a TypeError', () => {
  assert.throws(() => parseXML({}), /missing an <rss> element/)
  assert.throws(() => parseXML({rss: {channel: [{}]}}), /missing an <item>/)
  assert.throws(() => parseXML(appcast({enclosure: undefined})), /missing an <enclosure>/)
  assert.throws(() => parseXML(appcast({pubDate: undefined})), /missing a <pubDate>/)
  assert.throws(() => parseXML(appcast({'sparkle:minimumSystemVersion': undefined})), /missing sparkle:minimumSystemVersion/)
  assert.throws(() => parseXML(appcast({}, {length: undefined})), /missing length on the enclosure/)
  assert.throws(() => parseXML(appcast({}, {'sparkle:edSignature': undefined})), /missing sparkle:edSignature on the enclosure/)
  assert.throws(
    () => parseXML(appcast({'sparkle:deltas': [{enclosure: [{$: {'sparkle:deltaFrom': '97'}}]}]})),
    /missing length on the delta from 97/,
  )
})

test('sorts deltas newest first, comparing build numbers numerically', () => {
  assert.deepStrictEqual(deltasFrom('97', '100', '9', '105'), ['105', '100', '97', '9'])
  assert.deepStrictEqual(deltasFrom('1.2.9', '1.2.10', '1.1'), ['1.2.10', '1.2.9', '1.1'])
})
