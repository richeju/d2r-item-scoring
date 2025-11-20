const fs = require('fs');
const assert = require('assert');
assert.ok(fs.existsSync('index.html'), 'index.html should exist');
console.log('Basic check passed: index.html exists');

// Verify fixCommonOcrMistakes handles special characters
const html = fs.readFileSync('index.html', 'utf8');
const fixStart = html.indexOf('function fixCommonOcrMistakes');
const fixEnd = html.indexOf('function extractValue', fixStart);
assert(fixStart !== -1 && fixEnd !== -1, 'fixCommonOcrMistakes function not found');
const fixFnText = html.slice(fixStart, fixEnd);
eval(fixFnText);
const cleaned = fixCommonOcrMistakes('foo +1% bar');
assert.ok(cleaned.includes('+10%'), 'should replace +1% with +10%');
const cleaned2 = fixCommonOcrMistakes('DAMACE REDUCED BY 15%');
assert.ok(cleaned2.includes('DAMAGE'), 'should fix DAMACE spelling');
const cleaned3 = fixCommonOcrMistakes('+1 T ALL SKILLS');
assert.ok(cleaned3.includes(' TO ALL SKILLS'), 'should fix TO ALL SKILLS');
const cleaned4 = fixCommonOcrMistakes('LIGHNING DAMAGE');
assert.ok(cleaned4.includes('LIGHTNING'), 'should normalize misspelled lightning');
console.log('fixCommonOcrMistakes check passed');

const normalizeStart = html.indexOf('function normalizeText');
assert(normalizeStart !== -1, 'normalizeText function not found');
const normalizeTextBlock = html.slice(normalizeStart, fixStart);
eval(normalizeTextBlock);
const normalized = normalizeText('20 to strength 15 to all resistances');
assert.ok(normalized.includes('+20 TO STRENGTH'), 'should restore missing plus for attributes');
assert.ok(
  normalized.includes('+15 TO ALL RESISTANCES'),
  'should restore missing plus for resistances'
);
console.log('normalizeText check passed');
