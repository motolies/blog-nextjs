import 'server-only';

import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * 문서 페이지의 Code 탭이 보여줄 데모 파일 원문을 읽는다.
 *
 * 코드 문자열을 손으로 복제하지 않고 **실행되는 데모 파일 그 자체**를 읽는 이유:
 * 복제본은 데모가 바뀔 때 조용히 낡는다(전체 목록 탭의 EXPORT_INFO 대조와 같은
 * 부패 방지 철학). 이 앱은 로컬 전용이라 소스 트리가 항상 곁에 있다 —
 * standalone 배포를 하게 되면 `outputFileTracingIncludes` 로 데모를 추적에 넣어야 한다.
 *
 * 실패를 throw 하지 않고 `{ error }` 로 돌려주는 이유: 파일 이동·개명으로 경로가
 * 낡았을 때 문서 페이지 전체가 죽는 대신 해당 예제 블록에만 ErrorState 가 뜨게 한다 —
 * 부패가 화면에 드러나야 고쳐진다.
 */
export type DemoSource =
  | { readonly code: string; readonly error?: undefined }
  | { readonly code?: undefined; readonly error: string };

/** mtime 이 같으면 재사용하는 읽기 캐시 — dev HMR 로 파일이 바뀌면 즉시 무효화된다. */
const sourceCache = new Map<string, { mtimeMs: number; code: string }>();

/** apps/ui-docs 기준 상대 경로의 데모 파일을 읽는다 (dev·start 모두 cwd = apps/ui-docs). */
export function readDemoSource(relPath: string): DemoSource {
  const absPath = path.join(process.cwd(), relPath);
  try {
    const { mtimeMs } = statSync(absPath);
    const cached = sourceCache.get(relPath);
    if (cached && cached.mtimeMs === mtimeMs) return { code: cached.code };

    const code = readFileSync(absPath, 'utf8');
    sourceCache.set(relPath, { mtimeMs, code });
    return { code };
  } catch {
    return { error: `데모 소스를 읽지 못했다: ${relPath}` };
  }
}
