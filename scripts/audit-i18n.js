const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const ts = require('typescript');

const root = process.cwd();
const languages = ['es', 'en', 'de', 'fr'];

function loadLocale(lang) {
  const file = path.join(root, 'shared', 'i18n', 'locales', `${lang}.ts`);
  const source = fs.readFileSync(file, 'utf8');
  const transformed = source.replace(
    /export\s+default\s+([A-Za-z_$][\w$]*)\s*;?/,
    'module.exports = $1;',
  );
  const js = ts.transpileModule(transformed, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const moduleRef = { exports: {} };
  new Function('module', 'exports', js)(moduleRef, moduleRef.exports);
  return moduleRef.exports.default || moduleRef.exports;
}

function flatten(obj, prefix = '', out = []) {
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, next, out);
    } else {
      out.push(next);
    }
  }
  return out;
}

function sourceFiles() {
  const output = childProcess.execFileSync(
    'rg',
    ['--files', 'app', 'features', 'shared', '-g', '*.tsx', '-g', '*.ts', '-g', '*.js'],
    { cwd: root, encoding: 'utf8' },
  );
  return output.trim().split(/\r?\n/).filter(Boolean);
}

function collectUsedKeys() {
  const used = new Set();
  const dynamicPrefixes = new Set();
  const literalCall = /\bt\(\s*(['"])([^'"$]+)\1/g;
  const templateLiteral = /\bt\(\s*`([^`]+)`/g;

  for (const relativeFile of sourceFiles()) {
    const source = fs
      .readFileSync(path.join(root, relativeFile), 'utf8')
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    let match;
    while ((match = literalCall.exec(source))) {
      used.add(match[2]);
    }
    while ((match = templateLiteral.exec(source))) {
      const raw = match[1];
      if (raw.includes('${')) {
        const prefix = raw.split('${')[0].replace(/\.$/, '');
        if (prefix) dynamicPrefixes.add(prefix);
      } else {
        used.add(raw);
      }
    }
  }

  return { used, dynamicPrefixes };
}

const locales = Object.fromEntries(languages.map((lang) => [lang, loadLocale(lang)]));
const flattened = Object.fromEntries(languages.map((lang) => [lang, flatten(locales[lang]).sort()]));
const { used, dynamicPrefixes } = collectUsedKeys();
const usedKeys = [...used].sort();

const isUsed = (key) => used.has(key) || [...dynamicPrefixes].some((prefix) => key === prefix || key.startsWith(`${prefix}.`));

for (const lang of languages) {
  const keys = new Set(flattened[lang]);
  const missing = usedKeys.filter((key) => !keys.has(key));
  const unused = flattened[lang].filter((key) => !isUsed(key));
  console.log(`\n[${lang}] total=${keys.size} missing=${missing.length} unused=${unused.length}`);
  if (missing.length) {
    console.log('Missing:');
    console.log(missing.join('\n'));
  }
}

console.log(`\nUsed literal keys: ${usedKeys.length}`);
console.log(`Dynamic prefixes: ${[...dynamicPrefixes].sort().join(', ') || '(none)'}`);
