import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as HvyUI from '@hvy/ui';
import { describe, expect, it } from 'vitest';
import { EXPORT_INFO } from '../../client/ui-test/inventory-info';
import { DOCS, findDoc } from './registry';

/**
 * 문서 시스템의 부패 방지 — 화면(개요의 "데모 없음" 배지)이 못 잡는 정합을 CI 가 잡는다.
 *   1. 데모 파일 경로 실존 — 파일을 옮기거나 개명하면 Code 탭이 조용히 ErrorState 가 되므로
 *      여기서 먼저 깨뜨린다.
 *   2. slug · 예제 id 중복 — 라우트와 anchor 가 겹치면 어느 쪽이 이길지 정의되지 않는다.
 *   3. EXPORT_INFO 의 href 가 실제 등록된 문서를 가리키는가.
 *   4. barrel 의 런타임 export 전량이 EXPORT_INFO 에 등록됐는가 — 개요 화면의 "데모 없음"
 *      배지는 **사람이 볼 때만** 드러난다. worktabs 10 종이 배지를 단 채 오래 방치된 것이
 *      그 증거다. 화면에만 맡기지 않고 CI 로 옮긴다.
 */

/** _docs 는 apps/ui-docs/src/app/_docs — 3단계 위가 apps/ui-docs 다. */
const APP_ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');

describe('문서 레지스트리 정합', () => {
  it('category/slug 조합이 유일하다', () => {
    const keys = DOCS.map((doc) => `${doc.category}/${doc.slug}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('문서 안에서 예제 id 가 유일하다', () => {
    for (const doc of DOCS) {
      const ids = doc.examples.map((example) => example.id);
      expect(new Set(ids).size, `${doc.slug} 의 예제 id 중복`).toBe(ids.length);
    }
  });

  it('모든 데모 파일이 디스크에 실존한다', () => {
    for (const doc of DOCS) {
      for (const example of doc.examples) {
        expect(
          existsSync(path.join(APP_ROOT, example.file)),
          `${doc.category}/${doc.slug} 의 데모 파일이 없다: ${example.file}`,
        ).toBe(true);
      }
    }
  });

  it('barrel 의 모든 런타임 export 가 EXPORT_INFO 에 등록돼 있다', () => {
    // 타입 전용 export 는 런타임 값이 아니라 여기 잡히지 않는다 — 검사 대상도 아니다.
    const missing = Object.keys(HvyUI).filter((name) => !EXPORT_INFO[name]);
    expect(missing, 'EXPORT_INFO 에 없는 export — 데모를 붙이거나 note 를 적어라').toEqual([]);
  });

  it('EXPORT_INFO 에 barrel 밖의 유령 키가 없다', () => {
    const runtime = new Set(Object.keys(HvyUI));
    const stale = Object.keys(EXPORT_INFO).filter((name) => !runtime.has(name));
    expect(stale, 'barrel 에 없는데 EXPORT_INFO 에 남은 키 — 개명·삭제의 잔해다').toEqual([]);
  });

  it('EXPORT_INFO 의 href 가 등록된 문서를 가리킨다', () => {
    for (const [name, info] of Object.entries(EXPORT_INFO)) {
      if (!info.href) continue;
      const match = info.href.match(/^\/([^/#]+)\/([^/#]+)(?:#.*)?$/);
      expect(
        match,
        `${name} 의 href 형식이 /<category>/<slug> 가 아니다: ${info.href}`,
      ).not.toBeNull();
      if (!match) continue;
      expect(
        findDoc(match[1] ?? '', match[2] ?? ''),
        `${name} 의 href 가 미등록 문서다: ${info.href}`,
      ).toBeDefined();
    }
  });
});
