const chokidar = require('chokidar')
const spinner = require('./avaspinner.js')
const chalk = require('chalk')
const write = require('write')

const spawn = require('child_process').spawn
const fs = require('fs')
const path = require('path')

const pathsCache = path.resolve(__dirname, '.paths.cache.js')

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

    let argsHash = Object.values(args).join(',')
    let writeCache = false
    let cachedArgs

    // Check if the cache exists or if it is outdated.
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

        // Intersect the contents of src and dist to get the paths that need to be intercepted.
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
        let [dir1Contents, dir2Contents] = await Promise.all([srcRead, distRead])

        let interceptFiles = []
        dir1Contents.forEach((file) => {
            if (dir2Contents.includes(file)) {
                file = path.parse(file).name
                interceptFiles.push(file)
            }
        })

        // Log these //TODO
        console.log(`\nPaths to be intercepted: \n${chalk.green(interceptFiles)}`)

        // Write the paths to our paths file.
        // This will mkdir -p and or truncate if necessary.
        write.sync(pathsCache, `module.exports = {
            argsHash: '${argsHash}',
            interceptFiles: ${JSON.stringify(interceptFiles)},
            distRegex: ${distRegex}, /* This is a tring that we want to parse as a RegExp literal later. */
            srcDir: '${path.resolve(srcDir)}',
            distDir: '${path.resolve(distDir)}',
            testEntry: '${path.resolve(testEntry)}',
        }`)
    }

    let spawnOptions = {
        stdio: [
            process.stdin,
            process.stdout,
            process.stderr,
        ],
    }

    // Init flag to true so that we don't start until async actions are done
    let busy = false
    let runCount = 0

    // Ignores dotfiles.
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
                ['node_modules/.bin/ava', path.resolve(__dirname, './intercept.js')],
                spawnOptions,
            ).on('close', resolve)
        })

        // TODO: Find out why this is necessary and document it here.
        if (runCount) {
            console.log('\n')
        }
        // Start the spinner.
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
