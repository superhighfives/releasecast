const assert = require('assert')
const path = require('path')
const {test} = require('node:test')

require('ts-node').register({project: path.join(__dirname, '../tsconfig.json')})
const {default: generateMarkdown} = require('../src/generate-md')

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

test('rejects an appcast with no version', async () => {
  const {parseXML} = require('../src/generate-md')
  assert.throws(() => parseXML({rss: {channel: [{item: [{
    title: ['2.0.0'],
    enclosure: [{$: {}}],
  }]}]}}), /Version weirdness/)
})
