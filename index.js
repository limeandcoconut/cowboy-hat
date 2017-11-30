const chokidar = require('chokidar')
const chalk = require('chalk')
const write = require('write')

const spawn = require('child_process').spawn
const fs = require('fs')
const path = require('path')

const spinner = require('./avaspinner.js')

const pathsCache = path.resolve(__dirname, '.paths.cache.js')
// This pipes child process io to this process' io.
const spawnOptions = {
    stdio: [
        process.stdin,
        process.stdout,
        process.stderr,
    ],
}

module.exports = async function(args = {}) {
    let {
        srcDir = './src/',
        distDir = './dist/',
        testDir = './test/',
        testEntry = `${testDir}test.js`,
        watch = [srcDir, testDir],
    } = args

    srcDir = path.basename(srcDir)
    distDir = path.basename(distDir)

    // Create hash of arguments to identify the cache that may be created.
    let argsHash = Object.values(args).join(',')
    let writeCache = false
    let cachedArgs

    // Check a the cache exists or if it is for different args.
    try {
        cachedArgs = require(pathsCache).argsHash
    } catch (error) {
        // Cache doesn't exist, write it.
        if (/Cannot\sfind\smodule/.test(error)) {
            writeCache = true
        // Somethings really wrong, throw.
        } else {
            throw new Error(error)
        }
    }

    // If the cache isn't applicable write a new one.
    if (cachedArgs !== argsHash) {
        writeCache = true
    }

    if (writeCache) {
        // Regex to test required paths against.
        // This is a string because it will be parsed as js when our paths files is required.
        let distRegex = `/(^|[\\/\\.])${distDir}\\//`

        // Simultaneously read src and dist dirs for file contents.
        let srcRead = new Promise((resolve) => {
            fs.readdir(srcDir, (error, files) => {
                resolve(files)
            })
        })
        let distRead = new Promise((resolve) => {
            fs.readdir(distDir, (error, files) => {
                resolve(files)
            })
        })
        let [srcFiles, distFiles] = await Promise.all([srcRead, distRead])

        // Intersect the contents of src and dist to get the paths that can be intercepted.
        let interceptFiles = []
        srcFiles.forEach((file) => {
            if (distFiles.includes(file)) {
                // Only match the file names.
                file = path.parse(file).name
                interceptFiles.push(file)
            }
        })

        console.log(`\nPaths to be intercepted: \n${chalk.green(interceptFiles)}`)

        // Write the paths to our paths file.
        // This will runcate if necessary.
        write.sync(pathsCache, `module.exports = {
            argsHash: '${argsHash}', /* This identifies this cache as unique to it's args. */
            interceptFiles: ${JSON.stringify(interceptFiles)},
            distRegex: ${distRegex},
            srcDir: '${srcDir}',
            distDir: '${distDir}',
            testEntry: '${path.resolve(testEntry)}',
        }`)
    }

    let busy = false
    // Right now runCount is only used to make a log on the first log. e.g. runCount === 0
    let runCount = 0

    // Watch dirs ignoring dotfiles.
    chokidar.watch(watch, {
        ignored: /(^|[\/\\])\../,
    }).on('all', async(event) => {

        // If cowboyhat is already running or if the change is an add to the watch list skip it.
        if (busy || event === 'add') {
            return
        }
        busy = true

        // Await coverage and testing.
        await new Promise((resolve) => {
            spawn(
                'node_modules/.bin/nyc',
                // intercept.js will require the cached path information, setup intercepts for require() and then require the
                // test entry point.
                ['node_modules/.bin/ava', path.resolve(__dirname, './intercept.js')],
                spawnOptions,
            ).on('close', resolve)
        })

        // TODO: Find out why this is necessary and document it here.
        if (runCount) {
            console.log('\n')
        }

        // Start a spinner that mirrors AVA's while the lcov is being generated.
        spinner.start(' ')

        // Await the lcov report.
        await new Promise((resolve) => {
            spawn(
                'node_modules/.bin/nyc',
                ['report', '--reporter=lcov'],
                spawnOptions,
            ).on('close', resolve)
        })

        // When the report is done finish up.
        spinner.stop('\nlcov complete.')
        busy = false
        runCount += 1
    })
}
