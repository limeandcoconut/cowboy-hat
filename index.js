const chokidar = require('chokidar');
const replace = require('replace-in-file');
const spawn = require('child_process').spawn;

module.exports = () => {

    var {watch, to, from, testDir, testEntry} = arguments;

    to = to || '../src/';
    from = from || '../dist/';
    testDir = testDir || 'test/*.js';
    testEntry = testEntry || testDir;

    let toWatch = /^\.\.\//.test(to) ? to.replace(/^\.\.\//, '') : to;

    // Default to source dir and test dir
    if (!watch || watch.length === 0) {
        watch = [toWatch, testDir];
    }

    let begun = false;
    let deferred = [];
    let deferredIndex;

    // Watch test and src dirs, ignores .dotfiles
    chokidar.watch(watch, {
        ignored: /(^|[\/\\])\../,
    }).on('all', (event, path) => {
        // If cowboyhat is already running or if the change is an add to the watch list skip it.
        if (begun || event === 'add') {
            return;
        }

        // If the changed file is deferred skip it and reinstate it
        deferredIndex = deferred.indexOf(path);
        if (deferredIndex !== -1) {
            deferred.splice(deferredIndex, 1);
            return;
        }

        // Flag that we have begun working
        begun = true;

        // Replace original dir with cowboyhat dir
        let options = {
            files: [testDir],
            replace: new RegExp(from.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g'),
            with: to,
            allowEmptyPaths: false,
            encoding: 'utf8',
        };

        console.time('time');
        replace(options)
        .then(() => {
            // Run istanbul coverage
            // istanbul cover _mocha test.js
            let cover = spawn('node_modules/.bin/istanbul', ['cover', 'node_modules/.bin/_mocha', testEntry]);
            // Should this we be logging out?
            let logout = false;
            // The log to be displayed
            let log = '';

            cover.stdout.on('data', data => {
                // If the data matches the bookending lines for an istanbul report toggle logging and log first line
                if (/={5}/.test(data)) {
                    logout = !logout;
                    log += data;
                // Else maybe log
                } else if (logout) {
                    log += data;
                }
            });

            cover.stderr.on('data', data => {
                console.log(`stderr: ${data}`);
            });

            cover.on('close', () => {
                // Log out what was recorded
                console.log(log);

                // Swap back to original dist
                // Take off the cowboyhat :(
                options.replace = /..\/src\//g;
                options.replace = new RegExp(to.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g');
                options.with = from;

                replace(options)
                .then((changedFiles) => {
                    // After swap reallow changes and indicate that these files are deferred
                    // This is what allows the change fired from this event to be caught and skipped
                    deferred = changedFiles;
                    begun = false;
                    console.timeEnd('time');
                })
                .catch(error => {
                    console.error('Error occurred in inital direcotry swap:', error);
                });
            });
        })
        .catch(error => {
            console.error('Error occurred in inital direcotry swap:', error);
        });
    });
};
