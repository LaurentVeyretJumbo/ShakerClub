import { access, readFile } from 'node:fs/promises';

const requiredFiles = ['index.html', 'src/main.js', 'src/styles.css'];

await Promise.all(requiredFiles.map((file) => access(file)));

const [html, main] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('src/main.js', 'utf8'),
]);

const requiredSnippets = [
  ['index.html', html, 'id="app"'],
  ['src/main.js', main, 'DeviceMotionEvent.requestPermission'],
  ['src/main.js', main, 'accelerationIncludingGravity?.y'],
  ['src/main.js', main, 'requestAnimationFrame(update)'],
];

const missing = requiredSnippets.filter(([, content, snippet]) => !content.includes(snippet));

if (missing.length > 0) {
  for (const [file, , snippet] of missing) {
    console.error(`${file} must include ${snippet}`);
  }
  process.exit(1);
}

console.log('Static app verification passed.');
