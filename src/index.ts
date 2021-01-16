import {Command, flags} from '@oclif/command'
import stripIndent from 'strip-indent'
import chalk from 'chalk'
import shellac from 'shellac'
import tmp from 'tmp-promise'
import path from 'path'

import generateMarkdown from './lib/generate-md'

class Releasecast extends Command {
  static description = 'describe the command here'

  static flags = {
    email: flags.string({char: 'e', description: 'Apple Developer email', required: true}),
    releases: flags.string({char: 'r', description: 'Folder of releases to make deltas with'}),
    output: flags.string({char: 'o', description: 'Output folder'}),
    clean: flags.boolean({char: 'c', description: 'Clean Sparkle cache'}),
    dry: flags.boolean({char: 'd', description: 'Don\'t upload DMG to Apple\'s servers'}),

    // secondary
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
  }

  static args = [{name: 'app'}]

  async run() {
    const {args, flags} = this.parse(Releasecast)

    this.log(chalk.yellow('✨ Release·cast ✨'))
    this.log(chalk.yellow('⚡️ Casting...'))

    const {app} = args
    const {clean, email, releases, output, dry} = flags

    if (!app) {
      this.error('Please provide a .app file')
    }

    if (dry) {
      this.log(chalk.cyan('🤚 Dry run enabled'))
    }

    this.log(`- Scanning ${app}`)

    const {name, identifier, version, build} = await shellac`
      $ defaults read $PWD/${app}/Contents/Info CFBundleName
      stdout >> name

      $ defaults read $PWD/${app}/Contents/Info CFBundleIdentifier
      stdout >> identifier

      $ defaults read $PWD/${app}/Contents/Info CFBundleShortVersionString      
      stdout >> version

      $ defaults read $PWD/${app}/Contents/Info CFBundleVersion
      stdout >> build
    `

    this.log(stripIndent(`
      ${chalk.gray('Name:')} ${name}
      ${chalk.gray('Identifier:')} ${identifier}
      ${chalk.gray('Version:')} ${version}
      ${chalk.gray('Build number:')} ${build}
    `))

    if (clean) {
      await shellac`
        $ rm -rf ~/Library/Caches/Sparkle_generate_appcast
      `
    }

    const tmpDir = await tmp.dir({unsafeCleanup: true})
    const outputDir = output ? path.join(process.cwd(), output) : process.cwd()

    this.log(chalk.yellow('⚡️ 1. Processing DMG'))

    if (releases) {
      this.log('- Copying previous five releases for deltas')
      await shellac`
        $ ls ${releases}/*.dmg | sort -rV | head -5 | xargs -I{} cp {} ${tmpDir.path}
      `
      this.log('✔ Copied')
    }

    await shellac`
      $ ditto -rsrc ${app} ${tmpDir.path}/${app}
      in ${tmpDir.path} {
        $$ create-dmg ${app}
      }
    `

    this.log('- Renaming DMG...')
    await shellac.in(tmpDir.path)`
      $ mv "${name} ${version}.dmg" ${name}-${version}.dmg
      $ rm -rf ${app}
    `
    this.log(`✔ Renamed to ${name}-${version}.dmg`)

    const {dmg_count} = await shellac.in(tmpDir.path)`
      $ ls *.dmg | wc -l
      stdout >> dmg_count
    `

    if (Number(dmg_count) > 5) {
      this.warn('Only the latest five releases will be processed by appcast')
    }

    this.log()

    this.log(chalk.yellow('⚡️ 2. Notarising DMG with Apple'))
    if (dry) {
      this.log(chalk.cyan('🤚 Skipping notarisation'))
    } else {
      const {dmg_uuid} = await shellac.in(tmpDir.path)`
        $ xcrun altool --notarize-app --primary-bundle-id ${identifier}.dmg --username ${email} --password @keychain:Terminal --file ${name}-${version}.dmg
        stdout >> dmg_uuid
      `
      this.log('✔ Successfully uploaded')
      this.log(`ℹ ${dmg_uuid}`)
    }
    this.log()

    this.log(chalk.yellow('⚡️ 3. Generating release files'))

    await shellac.in(tmpDir.path)`
        $ generate_appcast .
        if ${output} {
          $ mkdir -p ${outputDir}
        }
        
        $ cp appcast.xml ${outputDir}
        $ cp ${name}-${version}.dmg ${outputDir}
        if ${releases} {
          $ cp ${name}${build}*.delta ${outputDir} | true
        }
      `
    this.log('✔ Releases generated, applicable deltas and appcast.xml saved')
    this.log()

    this.log(chalk.yellow('⚡️ 4. Generating metadata'))
    const markdown = await generateMarkdown(path.join(outputDir, 'appcast.xml'))
    console.log(markdown)

    // Tidy up temporary directory
    tmpDir.cleanup()
  }
}

export = Releasecast
