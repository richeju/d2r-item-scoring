const fs = require('fs');
const assert = require('assert');
assert.ok(fs.existsSync('index.html'), 'index.html should exist');
console.log('Basic check passed: index.html exists');
