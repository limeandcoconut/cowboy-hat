const result = require('../dist/mock-code.js')
const test = require('ava')

test('Should equal 1', (assert) => {
    assert.true(result === 1)
})
