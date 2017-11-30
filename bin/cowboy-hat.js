#! /usr/bin/env node

const yargs = require('yargs')
const path = require('path')
const cowboyHat = require('../index.js')

// cowboy-hat -d './dist/' -s './src/' -e 'test.js' -w ['./src/', './tests/'] -t './tests'
// cowboy-hat -d './dist/' -s './src/' -e 'test.js' -w ['./src/', './tests/']
// cowboy-hat -d './dist/' -s './src/' -e 'test.js'
// cowboy-hat -d './dist/' -s './src/'

let config

try {
    config = require(path.join(process.cwd(), '/cowboy-hat.config.js'))
} catch (error) {
    // DON'T PANIC 👍
    config = {}
}

let argv = yargs
    .option('distDir', {
        alias: 'd',
        describe: 'the directory that will be intercepted',
        type: 'string',
        default: './dist/',
        demand: !config,
    })
    .option('srcDir', {
        alias: 's',
        describe: 'the directory that will be the destination',
        type: 'string',
        default: './src/',
        demand: !config,
    })
    .option('testDir', {
        alias: 't',
        describe: 'the directory that holds your tests',
        type: 'string',
        default: './test/',
    })
    .option('testEntry', {
        alias: 'e',
        describe: 'the entry file for testing (default: testDir)',
        type: 'string',
        default: './test/',
    })
    .option('watch', {
        alias: 'w',
        describe: 'a glob of directories to watch [default: [<srcDir>, <testEntry>] ]',
        type: 'array',
        default: [],
    })
    .option('forceRewriteCache', {
        alias: 'f',
        describe: 'force the internal paths cache to update (usually for dev)',
        type: 'boolean',
        default: false,
    })
    .help()
    .argv

config.watch = argv.watch || config.watch
config.srcDir = argv.srcDir || config.srcDir
config.distDir = argv.distDir || config.distDir
config.testDir = argv.testDir || config.testDir
config.testEntry = argv.testEntry || config.testEntry

cowboyHat(config)
