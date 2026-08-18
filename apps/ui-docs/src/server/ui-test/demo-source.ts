import 'server-only';

import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * 문서 페이지의 Code 탭이 보여줄 데모 파일 원문을 읽는다.
 *
 * 코드 문자열을 손으로 복제하지 않고 **실행되는 데모 파일 그 자체**를 읽는 이유:
 * 복제본은 데모가 바뀔 때 조용히 낡는다(전체 목록 탭의 EXPORT_INFO 대조와 같은
 * 부패 방지 철학). 개발 중에는 소스 트리가 항상 곁에 있고, 컨테이너에서는 아래 조건으로
 * 소스를 곁에 둔다.
 *
 * 실패를 throw 하지 않고 `{ error }` 로 돌려주는 이유: 파일 이동·개명으로 경로가
 * 낡았을 때 문서 페이지 전체가 죽는 대신 해당 예제 블록에만 ErrorState 가 뜨게 한다 —
 * 부패가 화면에 드러나야 고쳐진다.
 *
 * ── 컨테이너(standalone) 에서 이 파일이 성립하는 조건 ────────────────────────
 * standalone 은 컴파일된 JS 만 담고 `.tsx` 소스는 버린다. 그래서 데모 폴더를
 * **`apps/ui-docs/Dockerfile` 의 명시적 COPY** 로 이미지에 넣는다. 그게 유일한 계약이니
 * 데모 폴더를 옮기면 그 COPY 경로도 같이 고쳐야 한다.
 * (`next.config.ts` 의 `outputFileTracingIncludes` 를 쓰지 않는 이유는 그 파일 주석 참조 —
 *  Turbopack 빌드에서 에러 없이 무시된다. 그래서 "설정했으니 됐다"가 성립하지 않는다.)
 * 빠뜨려도 빌드는 성공하고 화면도 뜬다. Code 탭만 전부 ErrorState 가 되므로
 * **컨테이너를 띄운 뒤 Code 탭을 눈으로 확인**하는 것이 검증 절차에 들어 있다.
 */
export type DemoSource =
  | { readonly code: string; readonly error?: undefined }
  | { readonly code?: undefined; readonly error: string };

/** mtime 이 같으면 재사용하는 읽기 캐시 — dev HMR 로 파일이 바뀌면 즉시 무효화된다. */
const sourceCache = new Map<string, { mtimeMs: number; code: string }>();

/** apps/ui-docs 기준 상대 경로의 데모 파일을 읽는다 (dev·start 모두 cwd = apps/ui-docs). */
export function readDemoSource(relPath: string): DemoSource {
  // turbopackIgnore — 이 동적 경로 조합을 보면 Next 는 "무엇을 읽을지 모르겠으니
  // 프로젝트 전체를 추적에 넣겠다"로 대응한다(빌드 경고 + standalone 에 src·public 전량 유입).
  // 무엇이 필요한지는 우리가 정확히 알고 있고 Dockerfile 이 그것만 COPY 하므로,
  // 추측을 끄고 그 명시 계약만 남긴다.
  const absPath = path.join(/* turbopackIgnore: true */ process.cwd(), relPath);
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
