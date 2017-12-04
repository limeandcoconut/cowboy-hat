const chokidar = require('chokidar')
const chalk = require('chalk')
const write = require('write')

const spawn = require('child_process').spawn
const fs = require('fs')
const path = require('path')

const spinner = require('./ava-spinner.js')
const cacheString = require('./cache-string.js')

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
        testEntry = path.join(testDir, './test.js'),
        watch = [path.resolve(srcDir), path.resolve(testDir)],
        forceRewriteCache = false,
        verbose = false,
    } = args

    srcDir = path.resolve(srcDir)
    distDir = path.resolve(distDir)

    // nyc will have it's child process run intercept.js, run AVA, and report to the cli plus lcov.info.
    // intercept.js will require the cached path information and setup proxies for require().
    const nycOptions = [
        '--reporter=lcov',
        '--reporter=text',
        'node_modules/.bin/ava',
        `--require=${path.resolve(__dirname, './intercept.js')}`,
        path.resolve(testEntry),
    ]

    // To test wether something is in the src dir.
    let srcRegex = new RegExp(`(^|[.\\/])${srcDir}[\\/]`)
    // Init cache string with arguments that won't need to update ever.
    cacheString.init(srcDir, distDir, verbose)
    // Create args UID for later.
    let argsInfo = [srcDir, distDir, testDir, testEntry, watch, forceRewriteCache, verbose]
    let argsUID = JSON.stringify(argsInfo)

    if (verbose) {
        console.log(chalk.blue(`\nargs UID:\n${JSON.stringify(argsInfo, null, 1)}`))
    }

    // Simultaneously read src and dist dirs for initial files.
    let srcRead = new Promise((resolve, reject) => {
        fs.readdir(srcDir, resolveFiles(resolve, reject))
    })
    let distRead = new Promise((resolve, reject) => {
        fs.readdir(distDir, resolveFiles(resolve, reject))
    })
    let [srcFiles, distFiles] = await Promise.all([srcRead, distRead])
    srcFiles = new Set(srcFiles)
    distFiles = new Set(distFiles)

    // Get initial array of proxy files.
    let proxyFiles = getproxyFiles(srcFiles, distFiles)
    if (!proxyFiles.length) {
        console.log(chalk.red('No files to proxy. Exiting.'))
        return
    }
    logProxyFiles(proxyFiles)
    // Create uid for this info to identify the cache that may be created.
    // This just has to be unique and include the arguments used and files to proxy.
    let infoUID = JSON.stringify(proxyFiles) + argsUID

    let writeCache = false

    // If not forced to rewrite the cache see if it's necessary.
    if (!forceRewriteCache) {
        let cachedUID
        // Check a the cache exists or if it is for different info.
        try {
            cachedUID = require(pathsCache).infoUID
        } catch (error) {
            // Cache doesn't exist, write one.
            writeCache = true
        }
        // If the cache isn't for the same args and proxies write a new one.
        if (cachedUID !== infoUID) {
            writeCache = true
        }
    }

    if (writeCache || forceRewriteCache) {
        if (forceRewriteCache) {
            console.log(chalk.yellow('\nForcing cache rewrite.'))
        } else if (verbose) {
            console.log(chalk.blue('\nRewriting cache.'))
        }
        // Write the paths to our paths file.
        // This will truncate if necessary.
        write.sync(pathsCache, cacheString.create(infoUID, proxyFiles))
    }

    let locked = false
    // Right now runCount is only used to make a newline on the first log. e.g. runCount === 0
    // TODO: Find out why this is necessary and document it.
    let runCount = 0

    // Watch dirs ignoring dotfiles and initial add events.
    // Run our initial reports when it's ready.
    chokidar.watch(watch, {
        ignored: /(^|[/\\])\../,
    }).on('change', runCoverage
    ).on('ready', runCoverage)

    // When files are added or removed from src or dist update the cache accordingly.
    let proxyDirs = [path.resolve(distDir), path.resolve(srcDir)]
    chokidar.watch(proxyDirs, {
        ignored: /(^|[/\\])\../,
        ignoreInitial: true,
    }).on('unlink', coverAnd('delete')
    ).on('add', coverAnd('add'))

    /**
     * Run nyc and AVA, then generate an lcov.info.
     * @function runCoverage
     * @async
    */
    async function runCoverage() {
        // If cowboyhat is already running skip.
        if (locked) {
            return
        }
        locked = true

        // Await coverage and testing.
        await new Promise((resolve) => {
            spawn(
                'node_modules/.bin/nyc',
                nycOptions,
                spawnOptions,
            ).on('close', resolve)
        })

        // TODO: Find out why this is necessary and document it here.
        if (runCount) {
            console.log('\n')
        }

        // When the report is done finish up.
        spinner.stop('\nlcov.info complete.')
        locked = false
        runCount += 1
    }

    /**
     * Do an intersection on the file Sets passed. These are the files that cowboy-hat needs to proxy.
     * @function getproxyFiles
     * @param   {Set}   aFiles      A set of files to instersect.
     * @param   {Set}   bFiles      A set of files to instersect.
     * @return  {Array}             Returns an array of files that need to be proxied.
    */
    function getproxyFiles(aFiles, bFiles) {

        // Intersect the contents of src and dist to get the paths that can be proxied.
        let proxyFiles = []
        aFiles.forEach((file) => {
            // If a file exists in both dirs and is a .js file proxy it.
            if (bFiles.has(file) && path.extname(file) === '.js') {
                proxyFiles.push(file)

            }
        })

        return proxyFiles
    }

    /**
     * Get a callback for a passed action.
     * @function coverAnd
     * @param   {String}    method  The method to call on the file Set that needs to be modified.
     * @return  {Function}          Returns a callback that adds or deletes a file from the correct file Set,
     *                              rewrites the cache, and calls runCoverage().
    */
    function coverAnd(method) {
        return (file) => {
            // Pick the file set that this belongs to.
            let filesSet
            let otherFilesSet
            if (srcRegex.test(file)) {
                filesSet = srcFiles
                otherFilesSet = distFiles
            } else {
                filesSet = distFiles
                otherFilesSet = srcFiles
            }

            // Add it to our set of files.
            let basename = path.basename(file)
            filesSet[method](basename)

            if (verbose) {
                let word = method === 'add' ? 'Adding' : 'Deleting'
                console.log(chalk.blue(`${word} ${basename}`))
            }

            // Get new proxy files.
            proxyFiles = getproxyFiles(filesSet, otherFilesSet)
            logProxyFiles(proxyFiles)
            let infoUID = JSON.stringify(proxyFiles) + argsUID

            if (verbose) {
                console.log(chalk.blue('\nRewriting cache.'))
            }

            // Write a new cache.
            write.sync(pathsCache, cacheString.create(infoUID, proxyFiles))
            // Cover
            runCoverage()
        }
    }
}

/**
 * Get a callback for fs.readdir() resolving a Promise.
 * @function resolveFiles
 * @param   {Function}  resolve     Promise resolution.
 * @param   {Function}  reject      Promise rejection.
 * @return  {Function}              A callback resolving a Promise.
*/
function resolveFiles(resolve, reject) {
    return (error, files) => {
        if (error) {
            reject(error)
        }
        resolve(files)
    }
}

/**
 * Log the proxy files to the console.
 * @function logProxyFiles
 * @param   {Array} proxyFiles  The files to be logged.
 */
function logProxyFiles(proxyFiles) {
    console.log(`\nFiles to be proxied: \n${chalk.green(proxyFiles)}`)
}
