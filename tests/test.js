const fs = require('fs');
const assert = require('assert');
const scoring = require('../src/scoring.js');

assert.ok(fs.existsSync('index.html'), 'index.html should exist');
assert.ok(fs.existsSync('src/scoring.js'), 'src/scoring.js should exist');

const html = fs.readFileSync('index.html', 'utf8');
assert.ok(html.includes('src/scoring.js'), 'index.html should load the shared scoring module');
console.log('Basic file checks passed');

const cleaned = scoring.fixCommonOcrMistakes('foo +1% bar');
assert.ok(cleaned.includes('+10%'), 'should replace +1% with +10%');
const cleaned2 = scoring.fixCommonOcrMistakes('DAMACE REDUCED BY 15%');
assert.ok(cleaned2.includes('DAMAGE'), 'should fix DAMACE spelling');
const cleaned3 = scoring.fixCommonOcrMistakes('+1 T ALL SKILLS');
assert.ok(cleaned3.includes(' TO ALL SKILLS'), 'should fix TO ALL SKILLS');
const cleaned4 = scoring.fixCommonOcrMistakes('LIGHNING DAMAGE');
assert.ok(cleaned4.includes('LIGHTNING'), 'should normalize misspelled lightning');
console.log('fixCommonOcrMistakes checks passed');

const normalized = scoring.normalizeText('20 to strength 15 to all resistances');
assert.ok(normalized.includes('+20 TO STRENGTH'), 'should restore missing plus for attributes');
assert.ok(
  normalized.includes('+15 TO ALL RESISTANCES'),
  'should restore missing plus for resistances'
);
console.log('normalizeText checks passed');

const englishDetails = scoring.computeScoreDetails(`
20 to strength
15 to all resistances
30% faster run walk
10% faster cast rate
+40 to life
`, 'melee');
assert.strictEqual(englishDetails.stats.str, 20, 'should parse strength when OCR missed +');
assert.strictEqual(englishDetails.stats.res, 15, 'should parse +15 TO ALL RESISTANCES');
assert.strictEqual(englishDetails.stats.frw, 30, 'should parse FASTER RUN WALK without slash');
assert.strictEqual(englishDetails.stats.fcr, 10, 'should parse faster cast rate');
assert.strictEqual(englishDetails.stats.hp, 40, 'should parse life');
assert.ok(englishDetails.score > 0, 'should score the parsed item');
console.log('English OCR scoring checks passed');

const frenchDetails = scoring.computeScoreDetails(`
+2 a toutes les competences
Resistance au froid +30
Resistance au feu +25
+35 points de vie
10% vitesse de lancement
`, 'caster');
assert.strictEqual(frenchDetails.stats.skills, 2, 'should parse French all skills');
assert.strictEqual(frenchDetails.stats.res, 55, 'should sum French individual resistances');
assert.strictEqual(frenchDetails.stats.hp, 35, 'should parse French life');
assert.strictEqual(frenchDetails.stats.fcr, 10, 'should parse French faster cast rate');
console.log('French OCR scoring checks passed');

const mixedDetails = scoring.computeScoreDetails(`
Lightning Resist +40
+15 To All Resistances
25% Faster Run/Walk
`, 'melee');
assert.strictEqual(mixedDetails.stats.res, 55, 'should parse both individual and all resistances');
assert.strictEqual(mixedDetails.stats.frw, 25, 'should parse FASTER RUN/WALK with slash');
console.log('Mixed OCR scoring checks passed');
