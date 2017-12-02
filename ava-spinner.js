const spinners = require('cli-spinners')
const chalk = require('chalk')
const logUpdate = require('log-update')

let spinnerDef = spinners[process.platform === 'win32' ? 'line' : 'dots']
let frames = spinnerDef.frames.map(char => chalk.gray.dim(char))
let intervalTime = spinnerDef.interval
let index = 0
let intervalId

module.exports = {
    start(prefix) {
        intervalId = setInterval(() => {
            index = (index + 1) % frames.length
            logUpdate(prefix + frames[index])
        }, intervalTime)
    },
    stop(final) {
        clearInterval(intervalId)
        index = 0
        logUpdate(final)
    },
}
