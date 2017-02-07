// console.time('require2');
const chokidar = require('chokidar');
const replace = require('replace-in-file');
const spawn = require('child_process').spawn;
// console.timeEnd('require2');

module.exports = ({watch, to, from, testDir, testEntry}) => {
    // console.time('entry');
    console.log(from);

    to = to || '../src/';
    from = from || '../dist/';
    testDir = testDir || 'test/*.js';
    testEntry = testEntry || testDir;

    if (!watch || watch.length === 0) {
        watch = [to, testDir];
    }

    let begun = false;
    let deferred = [];
    let deferredIndex;
    // console.timeEnd('entry');
    // console.time('watch');

    // Watch test and src dirs, ignores .dotfiles
    chokidar.watch(watch, {
        ignored: /(^|[\/\\])\../
    }).on('all', (event, path) => {
        // If an cowboyhat is already running or if the change is an add to the watch list skip it.
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
        // console.timeEnd('watch');
        // console.time('replace1');
        replace(options)
        .then(changedFiles => {
            // Run istanbul coverage
            // istanbul cover _mocha test.js
            // console.timeEnd('replace1');
            // console.time('spawn');
            let cover = spawn('node_modules/.bin/istanbul', ['cover', 'node_modules/.bin/_mocha', testEntry]);
            let logout = false;

            cover.stdout.on('data', data => {
                if (/^={10}/.test(data)) {
                    logout = !logout;
                }
                if (logout) {
                    console.log(`${data}`);
                }
            });

            cover.stderr.on('data', data => {
                console.log(`stderr: ${data}`);
            });

            cover.on('close', (code) => {

                // Swap back to original dist
                // Take off the cowboyhat :(
                options.replace = /..\/src\//g;
                options.replace = new RegExp(to.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g');
                options.with = from;

                // console.timeEnd('spawn');
                // console.time('replace2');
                replace(options)
                .then(changedFiles => {
                    // After swap reallow changes and indicate that these files are deferred
                    // This is what allows the change fired from this event to be caught and skipped
                    deferred = changedFiles;
                    begun = false;
                    // console.log('done');
                    console.timeEnd('time');
                    // console.timeEnd('replace2');
                })
                .catch(error => {
                    console.error('Error occurred in inital direcotry swap:', error);
                    //    begun = false;
                });

            });
        })
        .catch(error => {
            console.error('Error occurred in inital direcotry swap:', error);
            //    begun = false;
        });
    });
};
