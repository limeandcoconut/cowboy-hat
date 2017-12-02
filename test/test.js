const result = require('../dist/code-to-test.js')
const test = require('ava')

test('Should equal 1', (t) => {
    t.true(result === 1)
})
