#! /usr/bin/env node

const yargs = require('yargs')
const path = require('path')
const cowboyHat = require('../index.js')
const chalk = require('chalk')
const fs = require('fs')

// cowboy-hat -d='./dist/' -s='./src/' -t='./test' -e='test/test.js' -w=['./src/', './tests/'] -f
// cowboy-hat -c
// cowboy-hat -p
// cowboy-hat --help

let argv = yargs
    .options({
        distDir: {
            alias: 'd',
            describe: 'The directory that will be intercepted',
            type: 'string',
        },
        srcDir: {
            alias: 's',
            describe: 'The directory that will be the destination',
            type: 'string',
        },
        testDir: {
            alias: 't',
            describe: 'The directory that holds your tests',
            type: 'string',
        },
        testEntry: {
            alias: 'e',
            describe: 'The entry file for testing',
            type: 'string',
        },
        watch: {
            alias: 'w',
            describe: 'A glob of directories to watch',
            type: 'array',
        },
        // TODO: This should be a boolean. This is a hack to work until yargs fixes conflicts with booleans. yargs 10.0.3
        forceRewriteCache: {
            alias: 'f',
            describe: 'Force the internal paths cache to update (usually for dev)                                        [boolean]',
            // type: 'boolean',
        },
        // TODO: This should be a boolean. This is a hack to work until yargs fixes conflicts with booleans. yargs 10.0.3
        useConfigFile: {
            alias: 'c',
            describe: 'Use config file if present                  [boolean]',
            // type: 'boolean',
        },
        // TODO: This should be a boolean. This is a hack to work until yargs fixes conflicts with booleans. yargs 10.0.3
        usePackageConfig: {
            alias: 'p',
            describe: 'Use package.json as config file if present  [boolean]',
            // type: 'boolean',
        },
    })
    .conflicts({
        d: 'c',
        s: 'c',
        t: 'c',
        e: 'c',
        w: 'c',
        f: 'c',
        p: 'c',
    })
    .help()
    .argv

let config
// If using the config file get it.
if (argv.c) {
    try {
        config = require(path.join(process.cwd(), './cowboy-hat.config.js'))
    } catch (error) {
        // DON'T PANIC 👍
        config = {}
        console.log(chalk.yellow('\nNo config file found, proceeding with package defaults.'))
    }
    // Use package.json as config if it exists.
} else if (argv.p) {
    try {
        let json = JSON.parse(fs.readFileSync(path.join(process.cwd(), './package.json')))
        config = json['cowboy-hat'] || null
    } catch (error) {
        config = null
    }
    if (!config) {
        console.log(chalk.yellow('\nNo config section found in package.json, proceeding with package defaults.'))
        config = {}
    }
// Use yargs and don't copy extra argv keys.
} else {
    config = {
        watch: argv.watch,
        srcDir: argv.srcDir,
        distDir: argv.distDir,
        testDir: argv.testDir,
        testEntry: argv.testEntry,
        forceRewriteCache: argv.forceRewriteCache,
    }
}

cowboyHat(config)

