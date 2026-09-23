const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'node_modules/@vladmandic/human/models');
const destination = path.join(root, 'public/models/human');
fs.mkdirSync(destination, { recursive: true });
for (const model of ['blazeface', 'facemesh', 'faceres', 'antispoof', 'liveness', 'emotion']) {
  for (const extension of ['json', 'bin']) {
    fs.copyFileSync(path.join(source, `${model}.${extension}`), path.join(destination, `${model}.${extension}`));
  }
}
