import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const entry = path.join(appRoot, 'src/main.tsx');

/** Packages and raw docs that must not evaluate while painting `/`. */
const FORBIDDEN = [
  '@dnd-kit/core',
  '@dnd-kit/sortable',
  '@dnd-kit/utilities',
  '@posthog/react',
  '@steerco/core',
  '@xyflow/react',
  'mermaid',
  'posthog-js',
  'react-markdown',
  'remark-gfm',
];

function packageName(specifier: string): string {
  if (specifier.startsWith('@')) {
    const [scope, name] = specifier.split('/');
    return `${scope}/${name}`;
  }
  return specifier.split('/')[0] ?? specifier;
}

function isIdentChar(char: string | undefined): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    char === '_' ||
    char === '$'
  );
}

function isIdentStart(char: string | undefined): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || char === '_' || char === '$';
}

function skipWhitespaceAndComments(source: string, index: number): number {
  let i = index;
  while (i < source.length) {
    const char = source[i];
    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      i += 1;
      continue;
    }
    if (char === '/' && source[i + 1] === '/') {
      const nextLine = source.indexOf('\n', i);
      i = nextLine === -1 ? source.length : nextLine + 1;
      continue;
    }
    if (char === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 2;
      continue;
    }
    break;
  }
  return i;
}

function readWord(source: string, index: number): { word: string; next: number } | null {
  if (!isIdentStart(source[index])) return null;
  let i = index + 1;
  while (isIdentChar(source[i])) i += 1;
  return { word: source.slice(index, i), next: i };
}

function skipQuoted(source: string, index: number): number {
  const quote = source[index];
  if (quote !== "'" && quote !== '"' && quote !== '`') return index + 1;
  let i = index + 1;
  while (i < source.length) {
    if (source[i] === '\\') {
      i += 2;
      continue;
    }
    if (source[i] === quote) return i + 1;
    i += 1;
  }
  return source.length;
}

function readQuoted(source: string, index: number): string | null {
  const quote = source[index];
  if (quote !== "'" && quote !== '"') return null;
  let i = index + 1;
  let value = '';
  while (i < source.length) {
    if (source[i] === '\\') {
      value += source[i + 1] ?? '';
      i += 2;
      continue;
    }
    if (source[i] === quote) return value;
    value += source[i];
    i += 1;
  }
  return null;
}

function statementEnd(source: string, index: number): number {
  let i = index;
  let depth = 0;
  while (i < source.length) {
    const char = source[i];
    if (char === '/' && source[i + 1] === '/') {
      const nextLine = source.indexOf('\n', i);
      i = nextLine === -1 ? source.length : nextLine + 1;
      continue;
    }
    if (char === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 2;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      i = skipQuoted(source, i);
      continue;
    }
    if (char === '(' || char === '{' || char === '[') depth += 1;
    if (char === ')' || char === '}' || char === ']') depth = Math.max(0, depth - 1);
    if (char === ';' && depth === 0) return i + 1;
    i += 1;
  }
  return source.length;
}

function specifierIn(body: string): string | null {
  const trimmedAt = skipWhitespaceAndComments(body, 0);
  const direct = readQuoted(body, trimmedAt);
  if (direct) return direct;
  let i = 0;
  while (i < body.length) {
    const word = readWord(body, i);
    if (word?.word === 'from') {
      const after = skipWhitespaceAndComments(body, word.next);
      const quoted = readQuoted(body, after);
      if (quoted) return quoted;
    }
    i += word ? word.word.length : 1;
  }
  return null;
}

/** Static import/export specifiers only. `import()` calls are left for the string skipper. */
function specifiers(filePath: string): string[] {
  const source = fs.readFileSync(filePath, 'utf8');
  const found: string[] = [];
  let i = 0;
  let depth = 0;
  while (i < source.length) {
    const char = source[i];
    if (char === '/' && source[i + 1] === '/') {
      const nextLine = source.indexOf('\n', i);
      i = nextLine === -1 ? source.length : nextLine + 1;
      continue;
    }
    if (char === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 2;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      i = skipQuoted(source, i);
      continue;
    }
    if (char === '{') {
      depth += 1;
      i += 1;
      continue;
    }
    if (char === '}') {
      depth = Math.max(0, depth - 1);
      i += 1;
      continue;
    }
    if (depth === 0) {
      const word = readWord(source, i);
      if (word && (word.word === 'import' || word.word === 'export')) {
        const after = skipWhitespaceAndComments(source, word.next);
        if (source[after] !== '(') {
          const end = statementEnd(source, after);
          const body = source.slice(after, end);
          const typeWord = readWord(body, skipWhitespaceAndComments(body, 0));
          const typeOnly = typeWord?.word === 'type';
          const specifier = specifierIn(typeOnly ? body.slice(typeWord.next) : body);
          if (specifier && !typeOnly) found.push(specifier);
          i = end;
          continue;
        }
      }
    }
    i += 1;
  }
  return found;
}

function resolveRelative(fromFile: string, specifier: string): string | null {
  const bare = specifier.split('?')[0] ?? specifier;
  const base = path.resolve(path.dirname(fromFile), bare);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];
  return (
    candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ??
    null
  );
}

function eagerModules(start: string): { files: string[]; packages: string[]; rawDocs: string[] } {
  const files: string[] = [];
  const packages = new Set<string>();
  const rawDocs: string[] = [];
  const seen = new Set<string>();
  const queue = [start];

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    files.push(current);
    if (!current.endsWith('.ts') && !current.endsWith('.tsx')) continue;

    for (const specifier of specifiers(current)) {
      if (specifier.includes('.md')) {
        rawDocs.push(specifier);
        continue;
      }
      if (specifier.startsWith('.')) {
        const resolved = resolveRelative(current, specifier);
        if (resolved) queue.push(resolved);
        continue;
      }
      packages.add(packageName(specifier));
    }
  }

  return { files, packages: [...packages].sort(), rawDocs };
}

describe('home critical path', () => {
  it('does not statically import workspace, docs, or analytics modules', () => {
    const graph = eagerModules(entry);
    const leaked = FORBIDDEN.filter((name) => graph.packages.includes(name));
    expect(leaked, `eager packages:\n${graph.packages.join('\n')}`).toEqual([]);
    expect(graph.rawDocs, 'markdown must load with the docs route').toEqual([]);
  });
});
