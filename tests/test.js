const fs = require('fs');
const assert = require('assert');
assert.ok(fs.existsSync('index.html'), 'index.html should exist');
console.log('Basic check passed: index.html exists');

// Verify fixCommonOcrMistakes handles special characters
const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('function fixCommonOcrMistakes');
const end = html.indexOf('function extractValue', start);
assert(start !== -1 && end !== -1, 'fixCommonOcrMistakes function not found');
const fnText = html.slice(start, end);
eval(fnText);
const cleaned = fixCommonOcrMistakes('foo +1% bar');
assert.ok(cleaned.includes('+10%'), 'should replace +1% with +10%');
const cleaned2 = fixCommonOcrMistakes('DAMACE REDUCED BY 15%');
assert.ok(cleaned2.includes('DAMAGE'), 'should fix DAMACE spelling');
const cleaned3 = fixCommonOcrMistakes('+1 T ALL SKILLS');
assert.ok(cleaned3.includes(' TO ALL SKILLS'), 'should fix TO ALL SKILLS');
console.log('fixCommonOcrMistakes check passed');
