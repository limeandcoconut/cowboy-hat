#! /usr/bin/env node

const yargs = require('yargs')
const path = require('path')
const cowboyHat = require('../index.js')
const chalk = require('chalk')

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
    })
    // TODO: This should and doesn't provide info with --help. yargs 10.0.3
    .pkgConf('p')
    .conflicts({
        d: 'c',
        s: 'c',
        t: 'c',
        e: 'c',
        w: 'c',
        f: 'c',
        // TODO: -p should be exclusive with everything else. Arrays not supported yet. yargs 10.0.3
        p: 's',
    })
    .help()
    .argv

let config
// If using the config file get it.
if (argv.c) {
    try {
        config = require(path.join(process.cwd(), '/cowboy-hat.config.js'))
    } catch (error) {
        // DON'T PANIC 👍
        config = {}
        console.log(chalk.yellow('\nNo config file found, proceeding with package defaults.'))
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

