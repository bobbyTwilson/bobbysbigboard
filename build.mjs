import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

const out = '.vercel/output';
await rm(out, { recursive: true, force: true });
await mkdir(`${out}/static`, { recursive: true });
for (const file of ['index.html','styles.css','app.js']) await cp(file, `${out}/static/${file}`);
await writeFile(`${out}/config.json`, JSON.stringify({
  version: 3,
  routes: [
    { src: '/player/.*', dest: '/index.html' },
    { handle: 'filesystem' },
    { src: '/.*', dest: '/index.html' }
  ]
}, null, 2));
console.log("Built Bobby's Big Board static site.");
