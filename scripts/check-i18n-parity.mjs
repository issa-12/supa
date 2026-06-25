import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const repoRoot = process.cwd();
const i18nDir = path.join(repoRoot, 'src', 'app', 'i18n');
const languages = ['en', 'ar', 'fr'];

function readTranslationFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return readTranslationFiles(fullPath);
    return entry.name.endsWith('.translations.ts') ? [fullPath] : [];
  });
}

function propName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return undefined;
}

function collectKeys(node, prefix = '') {
  if (!ts.isObjectLiteralExpression(node)) return [];

  const keys = [];
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue;

    const key = propName(property.name);
    if (!key) continue;

    const fullKey = prefix ? `${prefix}.${key}` : key;
    keys.push(fullKey);

    if (ts.isObjectLiteralExpression(property.initializer)) {
      keys.push(...collectKeys(property.initializer, fullKey));
    }
  }

  return keys;
}

function topLevelProperties(node) {
  const map = new Map();
  if (!ts.isObjectLiteralExpression(node)) return map;

  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key = propName(property.name);
    if (key) map.set(key, property.initializer);
  }

  return map;
}

function findTranslationObjects(sourceFile) {
  const objects = [];

  function visit(node) {
    if (
      ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text === node.name.text.toUpperCase()
      && node.initializer
      && ts.isObjectLiteralExpression(node.initializer)
    ) {
      const props = topLevelProperties(node.initializer);
      if (languages.every((lang) => props.has(lang))) {
        objects.push({ name: node.name.text, props });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return objects;
}

function findGenreTranslationObjects(sourceFile) {
  const objects = [];

  function visit(node) {
    if (
      ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text === 'GENRE_TRANSLATIONS'
      && node.initializer
      && ts.isObjectLiteralExpression(node.initializer)
    ) {
      objects.push({ name: node.name.text, props: topLevelProperties(node.initializer) });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return objects;
}

const failures = [];

for (const filePath of readTranslationFiles(i18nDir)) {
  const source = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const translationObjects = findTranslationObjects(sourceFile);

  if (translationObjects.length === 0) {
    const genreObjects = findGenreTranslationObjects(sourceFile);
    if (genreObjects.length === 0) {
      failures.push(`${path.relative(repoRoot, filePath)}: no EN/AR/FR translation object found`);
      continue;
    }

    for (const { name, props } of genreObjects) {
      for (const [genre, value] of props) {
        const keys = new Set(collectKeys(value));
        for (const lang of ['ar', 'fr']) {
          if (!keys.has(lang)) {
            failures.push(`${path.relative(repoRoot, filePath)}:${name}.${genre} missing "${lang}"`);
          }
        }
      }
    }
    continue;
  }

  for (const { name, props } of translationObjects) {
    const [baseLang, ...otherLangs] = languages;
    const baseKeys = new Set(collectKeys(props.get(baseLang)));

    for (const lang of otherLangs) {
      const keys = new Set(collectKeys(props.get(lang)));
      const missing = [...baseKeys].filter((key) => !keys.has(key));
      const extra = [...keys].filter((key) => !baseKeys.has(key));

      for (const key of missing) {
        failures.push(`${path.relative(repoRoot, filePath)}:${name}.${lang} missing "${key}"`);
      }
      for (const key of extra) {
        failures.push(`${path.relative(repoRoot, filePath)}:${name}.${lang} extra "${key}"`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error('i18n parity check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`i18n parity check passed for ${languages.join(', ')}.`);
