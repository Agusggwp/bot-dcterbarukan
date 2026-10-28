import fs from 'fs';
import path from 'path';

const dir = 'src/dashboard/views';
const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;

const files = fs.readdirSync(dir).filter(f => f.endsWith('.ejs'));
let found = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const match = line.match(emojiRegex);
    if (match) {
      console.log(`[${file}:${idx + 1}] Found emoji '${match[0]}' in: ${line.trim()}`);
      found++;
    }
  });
}

if (found === 0) {
  console.log('ALL_VIEWS_CLEAN: 0 emojis found in src/dashboard/views!');
} else {
  console.log(`FOUND_EMOJIS: ${found} emojis found to replace.`);
}
