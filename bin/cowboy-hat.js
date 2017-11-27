#! /usr/bin/env node

const yargs = require('yargs')
const path = require('path')
const cowboyHat = require('../index.js')

// cowboy-hat -f '../dist/' -t '../src/' -e 'test.js' -w ['../src/', '../dist/']
// cowboy-hat -f '../dist/' -t '../src/' -e 'test.js'
// cowboy-hat -f '../dist/' -t '../src/'

let config

try {
    config = require(path.join(process.cwd(), '/cowboy-hat.config.js'))
} catch (error) {
    // DON'T PANIC
    config = {}
}

let argv = yargs
    .option('from', {
        alias: 'f',
        describe: 'the directory that will be swapped out',
        type: 'string',
        default: '../dist/',
        demand: !config,
    })
    .option('to', {
        alias: 't',
        describe: 'the directory that will be swapped to',
        type: 'string',
        default: '../src/',
        demand: !config,
    })
    .option('testDir', {
        alias: 'd',
        describe: 'the directory that holds your tests',
        type: 'string',
        default: 'test/*.js',
    })
    .option('testEntry', {
        alias: 'e',
        describe: 'the entry file for testing',
        type: 'string',
        default: 'test/*.js',
    })
    .option('watch', {
        alias: 'w',
        describe: 'a glob of directories to watch [default: [<to>, <testEntry>] ]',
        type: 'array',
        default: [],
    })
    // .demandOption(['from', 'to'], 'Please provide both to and from arguments to work with this tool')
    .help()
    .argv

config.watch = argv.watch || config.watch
config.to = argv.to || config.to
config.from = argv.from || config.from
config.testDir = argv.testDir || config.testDir
config.testEntry = argv.testEntry || config.testEntry

cowboyHat(config)
