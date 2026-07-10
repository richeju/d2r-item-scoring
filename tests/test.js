const fs = require('fs');
const assert = require('assert');
const vm = require('vm');
assert.ok(fs.existsSync('index.html'), 'index.html should exist');
console.log('Basic check passed: index.html exists');

// Verify fixCommonOcrMistakes handles special characters
const html = fs.readFileSync('index.html', 'utf8');
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(script => script.trim());
assert.ok(inlineScripts.length > 0, 'index.html should contain an inline application script');
for (const script of inlineScripts) {
  new vm.Script(script, { filename: 'index.html' });
}
console.log('Inline JavaScript syntax check passed');

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

const extractEnd = html.indexOf('function debugLog', fixEnd);
assert(extractEnd !== -1, 'extractValue function end not found');
eval(html.slice(fixEnd, extractEnd));

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

const beltOcr = normalizeText(
  'STONE BUCKLE BELT DEFENSE 7 DURABILITY 11 OF 16 REQUIRED STRENGTH 26 ' +
  'REQUIRED LEVEL 4 16% TO ATTACK RATING 24% ENHANCED DEFENSE ' +
  '2 TO STRENGTH +6 MAXIMUM STAMINA LIGHTNING RESIST +8'
);
assert.ok(beltOcr.includes('+2 TO STRENGTH'), 'should restore a missing plus before strength');
assert.ok(beltOcr.includes('+6 MAXIMUM STAMINA'), 'should preserve maximum stamina');

const attackRating = extractValue(
  beltOcr,
  /\+?([0-9]+)%?\s*(?:TO\s+)?(?:ATTACK\s*RATING|TAUX\s*D?ATTAQUE)/
);
const enhancedDefense = extractValue(
  beltOcr,
  /([0-9]+)%\s*(?:ENHANCED\s*DEFENSE|DEFENSE\s*ENHANCED|DEFENSE\s*AMELIOREE)/
);
const strength = extractValue(
  beltOcr,
  /\+?([0-9]+)\s+(?:(?:TO\s+)?(?:STRENGTH|STR)|(?:TO\s+)?FORCE)/
);
const stamina = extractValue(
  beltOcr,
  /\+?([0-9]+)\s*(?:TO\s*)?(?:MAXIMUM\s*STAMINA|ENDURANCE\s*MAXIMALE)/
);
assert.strictEqual(attackRating, 16, 'should parse percentage to attack rating');
assert.strictEqual(enhancedDefense, 24, 'should parse enhanced defense');
assert.strictEqual(strength, 2, 'should parse strength without using required strength');
assert.strictEqual(stamina, 6, 'should parse maximum stamina');
console.log('Stone Buckle OCR regression check passed');
