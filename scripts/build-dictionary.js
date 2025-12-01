// Build-time snapshot of the filtered French dictionary
const fs = require('fs');
const path = require('path');
const frenchWords = require('an-array-of-french-words');
const leoProfanity = require('leo-profanity');
const badwords = require('french-badwords-list');
const naughty = require('naughty-words');

function normalizeFrenchAccents(word) {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

async function main() {
  try {
    leoProfanity.clearList();
    leoProfanity.loadDictionary('fr');
    leoProfanity.add(badwords.array);
    leoProfanity.add(naughty.en);
    leoProfanity.add(naughty.fr);
  } catch {}

  const wordsSet = new Set();
  const byLen = new Map();

  for (const raw of frenchWords) {
    if (typeof raw !== 'string') continue;
    if (raw.includes('-')) continue;
    const lower = raw.toLowerCase();
    const normalized = normalizeFrenchAccents(raw);
    const normalizedLower = normalized.toLowerCase();

    if (leoProfanity.check(raw)) continue;
    if (leoProfanity.check(lower)) continue;
    if (leoProfanity.check(normalized)) continue;
    if (leoProfanity.check(normalizedLower)) continue;

    // Only add if not already in the set (deduplicate)
    if (wordsSet.has(normalized)) continue;
    
    wordsSet.add(normalized);
    const len = normalized.length;
    const bucket = byLen.get(len) || [];
    // Double-check: don't add duplicates in bucket either
    if (!bucket.includes(normalized)) {
      bucket.push(normalized);
    }
    byLen.set(len, bucket);
  }

  const all = Array.from(wordsSet).sort();
  const byLengthObj = {};
  for (const [len, arr] of byLen) {
    // Final deduplication pass: remove any remaining duplicates
    const unique = Array.from(new Set(arr)).sort();
    byLengthObj[len] = unique;
  }

  const snapshot = { all, byLength: byLengthObj };

  const outPath = path.join(
    __dirname,
    '..',
    'src',
    'lib',
    'dictionary.snapshot.json'
  );
  fs.writeFileSync(outPath, JSON.stringify(snapshot));
  console.log('Dictionary snapshot written:', outPath, `(${all.length} words)`);
}

main();
