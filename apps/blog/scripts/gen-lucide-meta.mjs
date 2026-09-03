#!/usr/bin/env node
/**
 * lucide 아이콘 메타데이터 생성기 — `src/lib/lucideMeta.json` 을 만든다.
 *
 * 아이콘 피커가 "전체 아이콘을 카테고리·태그로 검색"하려면 이름 목록과 태그·카테고리가 필요한데,
 * lucide-react 패키지에는 그 메타가 없다(lucide-static 도 tags.json 만 있고 categories.json 이 없다).
 * 그래서 lucide 저장소의 **설치된 버전과 같은 tag** 에서 `icons/*.json`(tags·categories·aliases)과
 * `categories/*.json`(title) 을 받아 하나의 JSON 으로 압축한다. 네트워크는 이 스크립트를 돌릴 때만
 * 쓰고, 빌드·런타임은 커밋된 JSON 만 읽는다.
 *
 * 언제 다시 돌리나: lucide-react 를 올렸을 때. `lucideMeta.test.ts` 가 JSON 의 version 과 설치 버전을
 * 비교하므로 잊으면 테스트가 알려준다.
 *
 * 실행: `pnpm -F blog gen:lucide-meta` (curl · tar 필요)
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.resolve(scriptDir, '../src/lib/lucideMeta.json');

/** lucide 의 kebab → PascalCase 변환을 그대로 재현한다(`createLucideIcon` 이 displayName 에 쓰는 규칙). */
function toPascalCase(kebab) {
  return kebab.replace(
    /(\w)(\w*)(_|-|\s*)/g,
    (_m, first, rest) => first.toUpperCase() + rest.toLowerCase(),
  );
}

/** 설치된 lucide-react 의 버전·경로. exports 맵이 없어 package.json 서브패스가 그대로 열린다. */
function locateLucideReact() {
  const pkgPath = require.resolve('lucide-react/package.json');
  const { version } = JSON.parse(readFileSync(pkgPath, 'utf8'));
  return { version, dir: path.dirname(pkgPath) };
}

/** 저장소 tarball 에서 icons/*.json · categories/*.json 만 추출해 임시 디렉터리 경로를 돌려준다. */
function fetchRepoMeta(version) {
  const work = mkdtempSync(path.join(tmpdir(), 'lucide-meta-'));
  const tgz = path.join(work, 'lucide.tgz');
  const url = `https://github.com/lucide-icons/lucide/archive/refs/tags/${version}.tar.gz`;
  console.log(`다운로드: ${url}`);
  execFileSync('curl', ['-fsSL', url, '-o', tgz], { stdio: 'inherit' });

  // GNU tar 는 패턴 매칭에 --wildcards 가 필요하고 bsdtar(macOS) 는 기본이다.
  const isGnu = execFileSync('tar', ['--version']).toString().includes('GNU');
  const patterns = ['*/icons/*.json', '*/categories/*.json'];
  execFileSync(
    'tar',
    [
      '-xzf',
      tgz,
      '-C',
      work,
      '--strip-components=1',
      ...(isGnu ? ['--wildcards'] : []),
      ...patterns,
    ],
    { stdio: 'inherit' },
  );
  return work;
}

/** 디렉터리의 *.json 을 { 파일명(확장자 제외): 파싱 결과 } 로 읽는다. */
function readJsonDir(dir) {
  const out = {};
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith('.json')) continue;
    out[file.slice(0, -'.json'.length)] = JSON.parse(readFileSync(path.join(dir, file), 'utf8'));
  }
  return out;
}

/** d.ts 의 `@deprecated` 주석 바로 뒤 `declare const X` 를 모아 브랜드 아이콘(PascalCase) 목록을 만든다. */
function readDeprecated(lucideDir) {
  const dts = readFileSync(path.join(lucideDir, 'dist/lucide-react.d.ts'), 'utf8');
  const names = new Set();
  for (const m of dts.matchAll(/@deprecated[^\n]*\n\s*\*\/\s*\ndeclare const (\w+):/g))
    names.add(m[1]);
  return names;
}

/** `dynamicIconImports` 의 키(kebab, 별칭 포함) — 런타임이 실제로 로드할 수 있는 이름의 전집합. */
function readDynamicKeys(lucideDir) {
  const src = readFileSync(path.join(lucideDir, 'dist/esm/dynamicIconImports.js'), 'utf8');
  return new Set([...src.matchAll(/^\s*"([^"]+)":\s*\(\)\s*=>\s*import\(/gm)].map((m) => m[1]));
}

/** 아이콘은 한 줄에 하나씩 써서 git diff 가 읽히게 한다(JSON.stringify 한 줄은 리뷰가 불가능하다). */
function serialize(meta) {
  const iconLines = Object.entries(meta.icons).map(
    ([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`,
  );
  return [
    '{',
    `  "version": ${JSON.stringify(meta.version)},`,
    `  "categories": ${JSON.stringify(meta.categories, null, 4).replace(/\n/g, '\n  ')},`,
    `  "deprecated": ${JSON.stringify(meta.deprecated)},`,
    '  "icons": {',
    iconLines.join(',\n'),
    '  }',
    '}',
    '',
  ].join('\n');
}

function main() {
  const { version, dir: lucideDir } = locateLucideReact();
  console.log(`lucide-react ${version} (${lucideDir})`);

  const work = fetchRepoMeta(version);
  try {
    const iconFiles = readJsonDir(path.join(work, 'icons'));
    const categoryFiles = readJsonDir(path.join(work, 'categories'));
    const dynamicKeys = readDynamicKeys(lucideDir);
    const deprecatedPascal = readDeprecated(lucideDir);

    const icons = {};
    const problems = [];
    for (const [name, data] of Object.entries(iconFiles)) {
      if (!dynamicKeys.has(name)) problems.push(`dynamicIconImports 에 없는 아이콘: ${name}`);
      const aliases = (data.aliases ?? []).map((a) => (typeof a === 'string' ? a : a.name));
      for (const alias of aliases) {
        if (!dynamicKeys.has(alias))
          problems.push(`dynamicIconImports 에 없는 별칭: ${name} → ${alias}`);
      }
      for (const c of data.categories ?? []) {
        if (!categoryFiles[c]) problems.push(`정의되지 않은 카테고리: ${name} → ${c}`);
      }
      const entry = { t: data.tags ?? [], c: data.categories ?? [] };
      if (aliases.length > 0) entry.a = aliases;
      icons[name] = entry;
    }

    const deprecated = Object.keys(icons).filter((name) =>
      deprecatedPascal.has(toPascalCase(name)),
    );
    if (deprecated.length !== deprecatedPascal.size) {
      problems.push(
        `deprecated 매칭 불일치: d.ts ${deprecatedPascal.size} vs 아이콘 ${deprecated.length} (${[...deprecatedPascal].join(', ')})`,
      );
    }
    if (problems.length > 0) {
      console.error(problems.join('\n'));
      process.exit(1);
    }

    const categories = Object.fromEntries(
      Object.entries(categoryFiles).map(([slug, data]) => [slug, data.title ?? slug]),
    );
    const meta = { version, categories, deprecated, icons };
    writeFileSync(outFile, serialize(meta));
    console.log(
      `완료: ${outFile}\n  아이콘 ${Object.keys(icons).length}개 · 카테고리 ${Object.keys(categories).length}개 · deprecated ${deprecated.length}개 · 별칭 ${Object.values(icons).reduce((n, e) => n + (e.a?.length ?? 0), 0)}개`,
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

main();
